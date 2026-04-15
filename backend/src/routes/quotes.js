const express   = require('express')
const { getDb } = require('../db/database')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// ─── helpers ───────────────────────────────────────────────────────────────

function nextQuoteNumber() {
  const year = new Date().getFullYear()
  const last = getDb()
    .prepare(`SELECT quote_number FROM quotes WHERE quote_number LIKE ? ORDER BY id DESC LIMIT 1`)
    .get(`AC-${year}-%`)

  let seq = 1
  if (last) {
    const parts = last.quote_number.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `AC-${year}-${String(seq).padStart(4, '0')}`
}

const JSON_FIELDS = ['rooms', 'units', 'pipework', 'electrical', 'labour', 'consumables']

function parseQuote(row) {
  for (const f of JSON_FIELDS) {
    try { row[f] = JSON.parse(row[f]) } catch { row[f] = f === 'rooms' || f === 'units' ? [] : {} }
  }
  return row
}

// ─── routes ────────────────────────────────────────────────────────────────

// GET /api/quotes/next-number  (must come before /:id)
router.get('/next-number', (_req, res) => {
  res.json({ quote_number: nextQuoteNumber() })
})

// GET /api/quotes
router.get('/', (_req, res) => {
  const rows = getDb().prepare(`
    SELECT q.id, q.quote_number, q.customer_name, q.customer_address,
           q.date, q.installation_type, q.status, q.total, q.created_at,
           u.name AS engineer_name
    FROM quotes q
    LEFT JOIN users u ON q.created_by = u.id
    ORDER BY q.created_at DESC
  `).all()
  res.json(rows)
})

// GET /api/quotes/:id
router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Quote not found' })
  res.json(parseQuote(row))
})

// POST /api/quotes
router.post('/', (req, res) => {
  const {
    customer_name, customer_address, date, installation_type,
    rooms, units, pipework, electrical, labour, consumables,
    notes, subtotal, total, quote_number,
  } = req.body

  const qn = quote_number || nextQuoteNumber()

  const result = getDb().prepare(`
    INSERT INTO quotes
      (quote_number, created_by, customer_name, customer_address, date, installation_type,
       rooms, units, pipework, electrical, labour, consumables, notes, subtotal, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    qn,
    req.user.id,
    customer_name  || '',
    customer_address || '',
    date           || new Date().toISOString().slice(0, 10),
    installation_type || 'single_split',
    JSON.stringify(rooms        || []),
    JSON.stringify(units        || []),
    JSON.stringify(pipework     || {}),
    JSON.stringify(electrical   || {}),
    JSON.stringify(labour       || {}),
    JSON.stringify(consumables  || {}),
    notes    || '',
    subtotal || 0,
    total    || 0,
  )

  res.status(201).json({ id: result.lastInsertRowid, quote_number: qn })
})

// PUT /api/quotes/:id
router.put('/:id', (req, res) => {
  const {
    customer_name, customer_address, date, installation_type, status,
    rooms, units, pipework, electrical, labour, consumables,
    notes, subtotal, total,
  } = req.body

  getDb().prepare(`
    UPDATE quotes SET
      customer_name    = ?,
      customer_address = ?,
      date             = ?,
      installation_type= ?,
      status           = ?,
      rooms            = ?,
      units            = ?,
      pipework         = ?,
      electrical       = ?,
      labour           = ?,
      consumables      = ?,
      notes            = ?,
      subtotal         = ?,
      total            = ?,
      updated_at       = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    customer_name    || '',
    customer_address || '',
    date             || new Date().toISOString().slice(0, 10),
    installation_type || 'single_split',
    status           || 'draft',
    JSON.stringify(rooms        || []),
    JSON.stringify(units        || []),
    JSON.stringify(pipework     || {}),
    JSON.stringify(electrical   || {}),
    JSON.stringify(labour       || {}),
    JSON.stringify(consumables  || {}),
    notes    || '',
    subtotal || 0,
    total    || 0,
    req.params.id,
  )

  res.json({ ok: true })
})

// DELETE /api/quotes/:id
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
