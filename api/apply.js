'use strict'

const { Readable } = require('node:stream')
const { submitPersonioApplication } = require('./lib/personio')

const allowedCvTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
])

const allowedCvExtensions = /\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i

const sendJson = (res, status, body) => {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(body)
  }
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  return res.end(JSON.stringify(body))
}

const toWebRequest = (req) => {
  const host =
    req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  const proto = req.headers['x-forwarded-proto'] || 'https'
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
    body: Readable.toWeb(req),
    duplex: 'half',
  })
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end()
    res.statusCode = 204
    return res.end()
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const companyId = process.env.PERSONIO_COMPANY_ID || ''
  const accessToken = process.env.PERSONIO_ACCESS_TOKEN || ''
  const recruitingChannelId = process.env.PERSONIO_RECRUITING_CHANNEL_ID || ''

  if (!companyId || !accessToken) {
    return sendJson(res, 503, {
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
      return sendJson(res, 400, {
        error:
          'Missing required fields: first_name, last_name, email, job_position_id',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(res, 400, { error: 'Invalid email address' })
    }

    if (!(cv instanceof File)) {
      return sendJson(res, 400, { error: 'CV file is required' })
    }

    const filename = cv.name || 'cv.pdf'

    if (!allowedCvExtensions.test(filename)) {
      return sendJson(res, 400, {
        error: 'CV must be pdf, doc, docx, txt, jpg, or png',
      })
    }

    if (
      cv.type &&
      !allowedCvTypes.has(cv.type) &&
      cv.type !== 'application/octet-stream'
    ) {
      return sendJson(res, 400, {
        error: `Unsupported CV content type: ${cv.type}`,
      })
    }

    const maxBytes = 20 * 1024 * 1024
    const data = new Uint8Array(await cv.arrayBuffer())
    if (data.byteLength > maxBytes) {
      return sendJson(res, 400, { error: 'CV must be 20MB or smaller' })
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

    return sendJson(res, 201, { ok: true })
  } catch (error) {
    console.error('[api/apply]', error)
    return sendJson(res, 502, {
      error: 'Failed to submit application to Personio',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

handler.config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
}

module.exports = handler
