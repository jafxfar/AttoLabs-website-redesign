import { XMLParser } from 'fast-xml-parser'
import type { PersonioJob } from '@/lib/personio'

const asArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

const asText = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#text'] ?? '')
  }
  return ''
}

const stripCdataNoise = (value: string) =>
  value
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim()

export const getPersonioSubdomain = () =>
  import.meta.env.VITE_PERSONIO_SUBDOMAIN || 'attolabs'

export const getJobsFeedUrl = (subdomain: string, language = 'en') =>
  `https://${subdomain}.jobs.personio.de/xml?language=${language}`

export const parsePersonioJobsXml = (xml: string): PersonioJob[] => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
    isArray: (name) =>
      ['position', 'office', 'jobDescription'].includes(name),
  })

  const parsed = parser.parse(xml) as {
    'workzag-jobs'?: {
      position?: Array<Record<string, unknown>>
    }
  }

  const positions = parsed['workzag-jobs']?.position ?? []

  return positions.map((position) => {
    const primaryOffices = asArray(position.office).map(asText).filter(Boolean)
    const additionalOffices = asArray(
      (position.additionalOffices as { office?: unknown } | undefined)?.office,
    )
      .map(asText)
      .filter(Boolean)
    const offices = [...primaryOffices, ...additionalOffices]

    const rawDescriptions = asArray(
      (position.jobDescriptions as { jobDescription?: unknown } | undefined)
        ?.jobDescription,
    ) as Array<Record<string, unknown>>

    const descriptions = rawDescriptions.map((item) => ({
      name: asText(item.name),
      value: stripCdataNoise(asText(item.value)),
    }))

    return {
      id: asText(position.id),
      name: asText(position.name),
      office: offices,
      department: asText(position.department),
      recruitingCategory: asText(position.recruitingCategory),
      employmentType: asText(position.employmentType),
      schedule: asText(position.schedule),
      seniority: asText(position.seniority),
      descriptions,
      createdAt: asText(position.createdAt),
    }
  })
}

export const fetchPersonioJobsFromFeed = async (
  language = 'en',
): Promise<PersonioJob[]> => {
  const subdomain = getPersonioSubdomain()
  const response = await fetch(getJobsFeedUrl(subdomain, language))
  if (!response.ok) {
    throw new Error(`Personio jobs feed failed: ${response.status}`)
  }
  const xml = await response.text()
  return parsePersonioJobsXml(xml)
}
