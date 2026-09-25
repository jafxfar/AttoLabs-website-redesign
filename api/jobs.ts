import { fetchPersonioJobs } from '../server/personio'

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
}

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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const url = new URL(request.url)
    const language = url.searchParams.get('language') || 'en'
    const subdomain = process.env.PERSONIO_COMPANY_SUBDOMAIN || 'attolabs'
    const jobs = await fetchPersonioJobs(subdomain, language)
    return json({ jobs })
  } catch (error) {
    console.error('[api/jobs]', error)
    return json(
      {
        error: 'Failed to load jobs from Personio',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      502,
    )
  }
}
