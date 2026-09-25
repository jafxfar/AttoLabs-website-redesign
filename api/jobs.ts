import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchPersonioJobs } from './lib/personio'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const language =
      typeof req.query.language === 'string' ? req.query.language : 'en'
    const subdomain = process.env.PERSONIO_COMPANY_SUBDOMAIN || 'attolabs'
    const jobs = await fetchPersonioJobs(subdomain, language)
    return res.status(200).json({ jobs })
  } catch (error) {
    console.error('[api/jobs]', error)
    return res.status(502).json({
      error: 'Failed to load jobs from Personio',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
