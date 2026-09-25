import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './app'

const apiPort = Number(process.env.API_PORT || 8787)

serve({ fetch: app.fetch, port: apiPort }, (info) => {
  console.log(`Personio API proxy listening on http://localhost:${info.port}`)
})
