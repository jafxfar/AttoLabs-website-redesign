'use strict'

/**
 * Personio recruiting helpers for Vercel Node (CommonJS).
 */

const personioHeaders = (config) => ({
  Authorization: `Bearer ${config.accessToken}`,
  'X-Company-ID': config.companyId,
})

const uploadPersonioDocument = async (config, file) => {
  const form = new FormData()
  const blob = new Blob([Buffer.from(file.data)], { type: file.contentType })
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
    throw new Error(
      `Personio document upload failed (${response.status}): ${detail}`,
    )
  }

  return response.json()
}

const createPersonioApplication = async (config, payload, document) => {
  const body = {
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

  if (payload.message && String(payload.message).trim()) {
    body.message = String(payload.message).trim()
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
    throw new Error(
      `Personio application failed (${response.status}): ${detail}`,
    )
  }
}

const submitPersonioApplication = async (config, payload) => {
  const document = await uploadPersonioDocument(config, payload.cv)
  await createPersonioApplication(config, payload, document)
}

module.exports = {
  submitPersonioApplication,
}
