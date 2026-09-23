import { XMLParser } from 'fast-xml-parser'

export type PersonioJobDescription = {
  name: string
  value: string
}

export type PersonioJob = {
  id: string
  name: string
  office: string[]
  department: string
  recruitingCategory: string
  employmentType: string
  schedule: string
  seniority: string
  descriptions: PersonioJobDescription[]
  createdAt: string
}

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

export const fetchPersonioJobs = async (
  subdomain: string,
  language = 'en',
): Promise<PersonioJob[]> => {
  const response = await fetch(getJobsFeedUrl(subdomain, language))
  if (!response.ok) {
    throw new Error(`Personio jobs feed failed: ${response.status}`)
  }
  const xml = await response.text()
  return parsePersonioJobsXml(xml)
}

type PersonioConfig = {
  companyId: string
  accessToken: string
  recruitingChannelId?: string
}

type UploadedDocument = {
  uuid: string
  original_filename: string
  extension?: string
  mimetype?: string
  size?: number
}

export type ApplyPayload = {
  jobPositionId: number
  firstName: string
  lastName: string
  email: string
  message?: string
  cv: {
    data: Buffer
    filename: string
    contentType: string
  }
}

const personioHeaders = (config: PersonioConfig) => ({
  Authorization: `Bearer ${config.accessToken}`,
  'X-Company-ID': config.companyId,
})

export const uploadPersonioDocument = async (
  config: PersonioConfig,
  file: ApplyPayload['cv'],
): Promise<UploadedDocument> => {
  const form = new FormData()
  const blob = new Blob([new Uint8Array(file.data)], { type: file.contentType })
  form.append('file', blob, file.filename)

  const response = await fetch(
    'https://api.personio.de/v1/recruiting/applications/documents',
    {
      method: 'POST',
      headers: personioHeaders(config),
      body: form,
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Personio document upload failed (${response.status}): ${detail}`)
  }

  return (await response.json()) as UploadedDocument
}

export const createPersonioApplication = async (
  config: PersonioConfig,
  payload: ApplyPayload,
  document: UploadedDocument,
): Promise<void> => {
  const body: Record<string, unknown> = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    job_position_id: payload.jobPositionId,
    files: [
      {
        uuid: document.uuid,
        original_filename: document.original_filename || payload.cv.filename,
        category: 'cv',
      },
    ],
  }

  if (payload.message?.trim()) {
    body.message = payload.message.trim()
  }

  if (config.recruitingChannelId) {
    const channelId = Number(config.recruitingChannelId)
    if (!Number.isNaN(channelId)) {
      body.recruiting_channel_id = channelId
    }
  }

  const response = await fetch(
    'https://api.personio.de/v1/recruiting/applications',
    {
      method: 'POST',
      headers: {
        ...personioHeaders(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (response.status !== 201) {
    const detail = await response.text()
    throw new Error(`Personio application failed (${response.status}): ${detail}`)
  }
}

export const submitPersonioApplication = async (
  config: PersonioConfig,
  payload: ApplyPayload,
): Promise<void> => {
  const document = await uploadPersonioDocument(config, payload.cv)
  await createPersonioApplication(config, payload, document)
}
