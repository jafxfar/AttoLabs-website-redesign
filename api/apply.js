'use strict'

const Busboy = require('busboy')

const allowedCvExtensions = /\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i

const sendJson = (res, status, body) => {
  try {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(status).json(body)
    }
  } catch (_) {
    /* fall through */
  }
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  return res.end(JSON.stringify(body))
}

const parseMultipart = (req) =>
  new Promise((resolve, reject) => {
    const fields = {}
    /** @type {{ data: Buffer, filename: string, mimeType: string } | null} */
    let cv = null

    let busboy
    try {
      busboy = Busboy({ headers: req.headers })
    } catch (error) {
      reject(error)
      return
    }

    busboy.on('file', (name, file, info) => {
      const chunks = []
      file.on('data', (chunk) => chunks.push(chunk))
      file.on('limit', () => {
        reject(new Error('CV file too large'))
      })
      file.on('end', () => {
        if (name === 'cv') {
          cv = {
            data: Buffer.concat(chunks),
            filename: info.filename || 'cv.pdf',
            mimeType: info.mimeType || 'application/octet-stream',
          }
        } else {
          file.resume()
        }
      })
    })

    busboy.on('field', (name, value) => {
      fields[name] = value
    })

    busboy.on('error', reject)
    busboy.on('finish', () => resolve({ fields, cv }))

    req.pipe(busboy)
  })

const personioHeaders = (companyId, accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  'X-Company-ID': companyId,
})

const submitToPersonio = async ({
  companyId,
  accessToken,
  recruitingChannelId,
  firstName,
  lastName,
  email,
  message,
  jobPositionId,
  cv,
}) => {
  const form = new FormData()
  form.append(
    'file',
    new Blob([new Uint8Array(cv.data)], { type: cv.mimeType }),
    cv.filename,
  )

  const uploadRes = await fetch(
    'https://api.personio.de/v1/recruiting/applications/documents',
    {
      method: 'POST',
      headers: personioHeaders(companyId, accessToken),
      body: form,
    },
  )

  if (!uploadRes.ok) {
    const detail = await uploadRes.text()
    throw new Error(`Document upload failed (${uploadRes.status}): ${detail}`)
  }

  const uploaded = await uploadRes.json()

  const body = {
    first_name: firstName,
    last_name: lastName,
    email,
    job_position_id: jobPositionId,
    files: [
      {
        uuid: uploaded.uuid,
        original_filename: uploaded.original_filename || cv.filename,
        category: 'cv',
      },
    ],
  }

  if (message) body.message = message

  if (recruitingChannelId) {
    const channelId = Number(recruitingChannelId)
    if (!Number.isNaN(channelId)) body.recruiting_channel_id = channelId
  }

  const applyRes = await fetch(
    'https://api.personio.de/v1/recruiting/applications',
    {
      method: 'POST',
      headers: {
        ...personioHeaders(companyId, accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (applyRes.status !== 201) {
    const detail = await applyRes.text()
    throw new Error(`Application failed (${applyRes.status}): ${detail}`)
  }
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
        'Personio credentials are not configured. Set PERSONIO_COMPANY_ID and PERSONIO_ACCESS_TOKEN in Vercel env.',
    })
  }

  try {
    const { fields, cv } = await parseMultipart(req)

    const firstName = String(fields.first_name || '').trim()
    const lastName = String(fields.last_name || '').trim()
    const email = String(fields.email || '').trim()
    const message = String(fields.message || '').trim()
    const jobPositionId = Number(fields.job_position_id)

    if (!firstName || !lastName || !email || Number.isNaN(jobPositionId)) {
      return sendJson(res, 400, {
        error:
          'Missing required fields: first_name, last_name, email, job_position_id',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJson(res, 400, { error: 'Invalid email address' })
    }

    if (!cv || !cv.data || cv.data.length === 0) {
      return sendJson(res, 400, { error: 'CV file is required' })
    }

    if (!allowedCvExtensions.test(cv.filename)) {
      return sendJson(res, 400, {
        error: 'CV must be pdf, doc, docx, txt, jpg, or png',
      })
    }

    if (cv.data.length > 4.5 * 1024 * 1024) {
      return sendJson(res, 400, {
        error: 'CV must be under 4.5MB on Vercel Hobby',
      })
    }

    await submitToPersonio({
      companyId,
      accessToken,
      recruitingChannelId,
      firstName,
      lastName,
      email,
      message: message || undefined,
      jobPositionId,
      cv,
    })

    return sendJson(res, 201, { ok: true })
  } catch (error) {
    console.error('[api/apply]', error)
    return sendJson(res, 502, {
      error: 'Failed to submit application to Personio',
      detail: error instanceof Error ? error.message : String(error),
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
