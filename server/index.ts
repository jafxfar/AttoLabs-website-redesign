import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  fetchPersonioJobs,
  submitPersonioApplication,
} from './personio.ts'

const app = new Hono()

const apiPort = Number(process.env.API_PORT || 8787)
const subdomain = process.env.PERSONIO_COMPANY_SUBDOMAIN || 'attolabs'
const companyId = process.env.PERSONIO_COMPANY_ID || ''
const accessToken = process.env.PERSONIO_ACCESS_TOKEN || ''
const recruitingChannelId = process.env.PERSONIO_RECRUITING_CHANNEL_ID || ''

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/jobs', async (c) => {
  try {
    const language = c.req.query('language') || 'en'
    const jobs = await fetchPersonioJobs(subdomain, language)
    return c.json({ jobs })
  } catch (error) {
    console.error('[api/jobs]', error)
    return c.json(
      {
        error: 'Failed to load jobs from Personio',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      502,
    )
  }
})

const allowedCvTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
])

const allowedCvExtensions = /\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i

app.post('/api/apply', async (c) => {
  if (!companyId || !accessToken) {
    return c.json(
      {
        error:
          'Personio credentials are not configured. Set PERSONIO_COMPANY_ID and PERSONIO_ACCESS_TOKEN in .env',
      },
      503,
    )
  }

  try {
    const form = await c.req.parseBody({ all: true })

    const firstName = String(form.first_name || '').trim()
    const lastName = String(form.last_name || '').trim()
    const email = String(form.email || '').trim()
    const message = String(form.message || '').trim()
    const jobPositionId = Number(form.job_position_id)
    const cv = form.cv

    if (!firstName || !lastName || !email || Number.isNaN(jobPositionId)) {
      return c.json(
        {
          error:
            'Missing required fields: first_name, last_name, email, job_position_id',
        },
        400,
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Invalid email address' }, 400)
    }

    if (!cv || typeof cv === 'string') {
      return c.json({ error: 'CV file is required' }, 400)
    }

    const file = cv as File
    const filename = file.name || 'cv.pdf'

    if (!allowedCvExtensions.test(filename)) {
      return c.json(
        { error: 'CV must be pdf, doc, docx, txt, jpg, or png' },
        400,
      )
    }

    if (file.type && !allowedCvTypes.has(file.type) && file.type !== 'application/octet-stream') {
      return c.json({ error: `Unsupported CV content type: ${file.type}` }, 400)
    }

    const maxBytes = 20 * 1024 * 1024
    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength > maxBytes) {
      return c.json({ error: 'CV must be 20MB or smaller' }, 400)
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
          data: buffer,
          filename,
          contentType: file.type || 'application/octet-stream',
        },
      },
    )

    return c.json({ ok: true }, 201)
  } catch (error) {
    console.error('[api/apply]', error)
    return c.json(
      {
        error: 'Failed to submit application to Personio',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      502,
    )
  }
})

serve({ fetch: app.fetch, port: apiPort }, (info) => {
  console.log(`Personio API proxy listening on http://localhost:${info.port}`)
})
