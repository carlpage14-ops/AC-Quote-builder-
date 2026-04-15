const express   = require('express')
const { getDb } = require('../db/database')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// GET /api/settings  — any authenticated user (needed for labour rate on quote form)
router.get('/', requireAuth, (_req, res) => {
  const rows = getDb().prepare('SELECT key, value FROM settings').all()
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
})

// PUT /api/settings  — admin only
router.put('/', requireAdmin, (req, res) => {
  const db     = getDb()
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')

  const updateAll = db.transaction(entries => {
    for (const [key, value] of entries) {
      upsert.run(key, String(value ?? ''))
    }
  })

  updateAll(Object.entries(req.body))
  res.json({ ok: true })
})

module.exports = router
