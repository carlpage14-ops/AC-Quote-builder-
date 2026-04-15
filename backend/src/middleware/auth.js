const jwt = require('jsonwebtoken')

const SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-in-production'

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' })
  }
  try {
    req.user = jwt.verify(header.slice(7), SECRET())
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' })
    next()
  })
}

module.exports = { requireAuth, requireAdmin, SECRET }
