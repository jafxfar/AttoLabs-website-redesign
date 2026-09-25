'use strict'

/**
 * Minimal health check — confirms Vercel Node functions load.
 * GET /api/health → { ok: true }
 */
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (typeof res.status === 'function') {
    return res.status(200).json({ ok: true, runtime: 'node' })
  }
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ ok: true, runtime: 'node' }))
}
