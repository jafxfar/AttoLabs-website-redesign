import { submitPersonioApplication } from '../server/personio'

export const config = {
  runtime: 'nodejs',
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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const companyId = process.env.PERSONIO_COMPANY_ID || ''
  const accessToken = process.env.PERSONIO_ACCESS_TOKEN || ''
  const recruitingChannelId = process.env.PERSONIO_RECRUITING_CHANNEL_ID || ''

  if (!companyId || !accessToken) {
    return json(
      {
        error:
          'Personio credentials are not configured. Set PERSONIO_COMPANY_ID and PERSONIO_ACCESS_TOKEN',
      },
      503,
    )
  }

  try {
    const form = await request.formData()
    const firstName = String(form.get('first_name') || '').trim()
    const lastName = String(form.get('last_name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const message = String(form.get('message') || '').trim()
    const jobPositionId = Number(form.get('job_position_id'))
    const cv = form.get('cv')

    if (!firstName || !lastName || !email || Number.isNaN(jobPositionId)) {
      return json(
        {
          error:
            'Missing required fields: first_name, last_name, email, job_position_id',
        },
        400,
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address' }, 400)
    }

    if (!(cv instanceof File)) {
      return json({ error: 'CV file is required' }, 400)
    }

    const filename = cv.name || 'cv.pdf'

    if (!allowedCvExtensions.test(filename)) {
      return json(
        { error: 'CV must be pdf, doc, docx, txt, jpg, or png' },
        400,
      )
    }

    if (
      cv.type &&
      !allowedCvTypes.has(cv.type) &&
      cv.type !== 'application/octet-stream'
    ) {
      return json({ error: `Unsupported CV content type: ${cv.type}` }, 400)
    }

    const maxBytes = 20 * 1024 * 1024
    const data = new Uint8Array(await cv.arrayBuffer())
    if (data.byteLength > maxBytes) {
      return json({ error: 'CV must be 20MB or smaller' }, 400)
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

    return json({ ok: true }, 201)
  } catch (error) {
    console.error('[api/apply]', error)
    return json(
      {
        error: 'Failed to submit application to Personio',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      502,
    )
  }
}
