import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Readable } from 'node:stream'
import { submitPersonioApplication } from './lib/personio'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
}

const allowedCvTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
])

const allowedCvExtensions = /\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i

const toWebRequest = (req: VercelRequest): Request => {
  const host =
    (req.headers['x-forwarded-host'] as string | undefined) ||
    req.headers.host ||
    'localhost'
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https'
  const url = `${proto}://${host}${req.url || '/api/apply'}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue
    headers.set(key, Array.isArray(value) ? value.join(',') : value)
  }

  const method = req.method || 'POST'
  if (method === 'GET' || method === 'HEAD') {
    return new Request(url, { method, headers })
  }

  return new Request(url, {
    method,
    headers,
    // @ts-expect-error Node duplex body for undici Request
    body: Readable.toWeb(req as unknown as NodeJS.ReadableStream),
    duplex: 'half',
  })
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const companyId = process.env.PERSONIO_COMPANY_ID || ''
  const accessToken = process.env.PERSONIO_ACCESS_TOKEN || ''
  const recruitingChannelId = process.env.PERSONIO_RECRUITING_CHANNEL_ID || ''

  if (!companyId || !accessToken) {
    return res.status(503).json({
      error:
        'Personio credentials are not configured. Set PERSONIO_COMPANY_ID and PERSONIO_ACCESS_TOKEN',
    })
  }

  try {
    const request = toWebRequest(req)
    const form = await request.formData()

    const firstName = String(form.get('first_name') || '').trim()
    const lastName = String(form.get('last_name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const message = String(form.get('message') || '').trim()
    const jobPositionId = Number(form.get('job_position_id'))
    const cv = form.get('cv')

    if (!firstName || !lastName || !email || Number.isNaN(jobPositionId)) {
      return res.status(400).json({
        error:
          'Missing required fields: first_name, last_name, email, job_position_id',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    if (!(cv instanceof File)) {
      return res.status(400).json({ error: 'CV file is required' })
    }

    const filename = cv.name || 'cv.pdf'

    if (!allowedCvExtensions.test(filename)) {
      return res.status(400).json({
        error: 'CV must be pdf, doc, docx, txt, jpg, or png',
      })
    }

    if (
      cv.type &&
      !allowedCvTypes.has(cv.type) &&
      cv.type !== 'application/octet-stream'
    ) {
      return res.status(400).json({
        error: `Unsupported CV content type: ${cv.type}`,
      })
    }

    const maxBytes = 20 * 1024 * 1024
    const data = new Uint8Array(await cv.arrayBuffer())
    if (data.byteLength > maxBytes) {
      return res.status(400).json({ error: 'CV must be 20MB or smaller' })
    }

    await submitPersonioApplication(
      {
        companyId,
        accessToken,
        recruitingChannelId: recruitingChannelId || undefined,
      },
      {
        jobPositionId,
        firstName,
        lastName,
        email,
        message: message || undefined,
        cv: {
          data,
          filename,
          contentType: cv.type || 'application/octet-stream',
        },
      },
    )

    return res.status(201).json({ ok: true })
  } catch (error) {
    console.error('[api/apply]', error)
    return res.status(502).json({
      error: 'Failed to submit application to Personio',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
