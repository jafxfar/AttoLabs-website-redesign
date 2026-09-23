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

export type JobsResponse = {
  jobs: PersonioJob[]
}

export type ApplyResult =
  | { ok: true }
  | { ok: false; error: string; detail?: string }

export const formatJobMeta = (job: PersonioJob) => {
  const offices = job.office.length > 0 ? job.office.join(', ') : 'Location TBD'
  const schedule = job.schedule
    ? job.schedule.replaceAll('-', ' ')
    : 'full time'
  return `${offices} / ${schedule}`
}

export const fetchJobs = async (language = 'en'): Promise<PersonioJob[]> => {
  const response = await fetch(`/api/jobs?language=${encodeURIComponent(language)}`)
  const data = (await response.json()) as JobsResponse & {
    error?: string
    detail?: string
  }

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to load jobs')
  }

  return data.jobs ?? []
}

export type ApplyInput = {
  jobPositionId: string
  firstName: string
  lastName: string
  email: string
  message?: string
  cv: File
}

export const submitApplication = async (
  input: ApplyInput,
): Promise<ApplyResult> => {
  const form = new FormData()
  form.append('job_position_id', input.jobPositionId)
  form.append('first_name', input.firstName)
  form.append('last_name', input.lastName)
  form.append('email', input.email)
  if (input.message?.trim()) {
    form.append('message', input.message.trim())
  }
  form.append('cv', input.cv)

  const response = await fetch('/api/apply', {
    method: 'POST',
    body: form,
  })

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    detail?: string
  }

  if (!response.ok) {
    return {
      ok: false,
      error: data.error || 'Application failed',
      detail: data.detail,
    }
  }

  return { ok: true }
}
