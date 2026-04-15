const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { initDb } = require('./db/database')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' })) // 10mb for base64 logo uploads

app.use('/api/auth',     require('./routes/auth'))
app.use('/api/quotes',   require('./routes/quotes'))
app.use('/api/settings', require('./routes/settings'))
app.use('/api/pdf',      require('./routes/pdf'))

// Simple health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

initDb()
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
