const express   = require('express')
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const { getDb } = require('../db/database')
const { requireAdmin, SECRET } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase().trim())

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const payload = { id: user.id, name: user.name, email: user.email, is_admin: !!user.is_admin }
  const token   = jwt.sign(payload, SECRET(), { expiresIn: '8h' })

  res.json({ token, user: payload })
})

// GET /api/auth/users  — admin: list all engineers
router.get('/users', requireAdmin, (req, res) => {
  const users = getDb()
    .prepare('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at')
    .all()
  res.json(users)
})

// POST /api/auth/users  — admin: create a new engineer account
router.post('/users', requireAdmin, (req, res) => {
  const { name, email, password, is_admin } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }

  try {
    const hash = bcrypt.hashSync(password, 10)
    const result = getDb()
      .prepare('INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.toLowerCase().trim(), hash, is_admin ? 1 : 0)
    res.status(201).json({ id: result.lastInsertRowid, name, email: email.toLowerCase(), is_admin: !!is_admin })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with that email already exists' })
    }
    throw err
  }
})

// DELETE /api/auth/users/:id  — admin: remove an engineer
router.delete('/users/:id', requireAdmin, (req, res) => {
  if (req.user.id === parseInt(req.params.id)) {
    return res.status(400).json({ error: 'You cannot delete your own account' })
  }
  getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
