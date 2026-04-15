const Database = require('better-sqlite3')
const bcrypt   = require('bcryptjs')
const path     = require('path')
const fs       = require('fs')

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../../data/quotes.db')

let db

function getDb() {
  if (!db) {
    // Ensure the data directory exists
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number      TEXT    UNIQUE NOT NULL,
      created_by        INTEGER REFERENCES users(id),
      customer_name     TEXT    NOT NULL,
      customer_address  TEXT    NOT NULL DEFAULT '',
      date              TEXT    NOT NULL,
      installation_type TEXT    NOT NULL,
      status            TEXT    DEFAULT 'draft',
      rooms             TEXT    DEFAULT '[]',
      units             TEXT    DEFAULT '[]',
      pipework          TEXT    DEFAULT '{}',
      electrical        TEXT    DEFAULT '{}',
      labour            TEXT    DEFAULT '{}',
      consumables       TEXT    DEFAULT '{}',
      notes             TEXT    DEFAULT '',
      subtotal          REAL    DEFAULT 0,
      total             REAL    DEFAULT 0,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed default settings (INSERT OR IGNORE = never overwrite user changes)
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const defaults = [
    ['labour_rate',          '45.00'],
    ['pipework_rate',        '12.00'],
    ['consumables_type',     'percentage'],
    ['consumables_value',    '5'],
    ['company_name',         'AC Solutions Ltd'],
    ['company_address',      ''],
    ['company_phone',        ''],
    ['company_email',        ''],
    ['company_logo',         ''],
    ['terms_and_conditions', 'Payment is due within 30 days of invoice date. All equipment remains the property of the company until payment is received in full. This quotation is valid for 30 days from the date of issue. Prices are subject to survey and site conditions.'],
    ['vat_rate',             '20'],
    ['include_vat',          'false'],
  ]
  for (const [key, value] of defaults) insert.run(key, value)

  // Create a default admin if none exists
  const hasAdmin = db.prepare('SELECT id FROM users WHERE is_admin = 1').get()
  if (!hasAdmin) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare('INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)')
      .run('Admin', 'admin@acquotes.local', hash)
    console.log('─────────────────────────────────────────────')
    console.log('  Default admin account created:')
    console.log('  Email:    admin@acquotes.local')
    console.log('  Password: admin123')
    console.log('  Change this immediately in Settings!')
    console.log('─────────────────────────────────────────────')
  }

  console.log(`Database ready: ${DB_PATH}`)
}

module.exports = { getDb, initDb }
