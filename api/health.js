'use strict'

// Module-load probe — if this never appears in Vercel Logs, the function
// crashes before the handler runs (often ESM/CJS or dependency load).
console.log('[api/health] module evaluating', {
  node: process.version,
  typeModule: process.env.npm_package_type || '(unset)',
  cwd: process.cwd(),
})

module.exports = function handler(req, res) {
  console.log('[api/health] invoke', {
    method: req.method,
    url: req.url,
  })

  const body = {
    ok: true,
    runtime: 'node',
    node: process.version,
    time: new Date().toISOString(),
  }

  try {
    if (typeof res.status === 'function') {
      return res.status(200).json(body)
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify(body))
  } catch (error) {
    console.error('[api/health] respond failed', error)
    throw error
  }
}
