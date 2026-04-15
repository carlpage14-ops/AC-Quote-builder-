const express    = require('express')
const PDFDocument = require('pdfkit')
const { getDb }  = require('../db/database')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/pdf/:id  → streams a PDF download
router.get('/:id', (req, res) => {
  const db    = getDb()
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id)
  if (!quote) return res.status(404).json({ error: 'Quote not found' })

  const JSON_FIELDS = ['rooms', 'units', 'pipework', 'electrical', 'labour', 'consumables']
  for (const f of JSON_FIELDS) {
    try { quote[f] = JSON.parse(quote[f]) }
    catch { quote[f] = f === 'rooms' || f === 'units' ? [] : {} }
  }

  const settingsRows = db.prepare('SELECT key, value FROM settings').all()
  const s = Object.fromEntries(settingsRows.map(r => [r.key, r.value]))

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="Quote-${quote.quote_number}.pdf"`)

  const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true })
  doc.pipe(res)
  buildPdf(doc, quote, s)
  doc.end()
})

// ─── PDF builder ────────────────────────────────────────────────────────────

const BLUE       = '#1e40af'
const LIGHT_BLUE = '#dbeafe'
const GREY_BG    = '#f8fafc'
const DARK       = '#1f2937'
const MID        = '#6b7280'
const BORDER     = '#e5e7eb'
const WHITE      = '#ffffff'
const PAGE_W     = 595.28 - 100  // A4 width minus 50px margins each side

function fmt(n) {
  return `£${parseFloat(n || 0).toFixed(2)}`
}

function installLabel(type) {
  return { single_split: 'Single Split', multi_split: 'Multi-Split', cassette: 'Cassette', vrf_vrv: 'VRF/VRV System' }[type] || type
}

function buildPdf(doc, quote, s) {
  // ── HEADER ──────────────────────────────────────────────────────────────
  const logoH = 55

  // Logo (if stored as a base64 data URL)
  if (s.company_logo && s.company_logo.startsWith('data:image')) {
    try {
      const buf = Buffer.from(s.company_logo.split(',')[1], 'base64')
      doc.image(buf, 50, 45, { fit: [160, logoH] })
    } catch { /* bad logo data — skip */ }
  }

  // "QUOTATION" badge — top right
  doc.rect(50 + PAGE_W - 140, 42, 140, 34).fill(BLUE)
  doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
     .text('QUOTATION', 50 + PAGE_W - 135, 50, { width: 130, align: 'center' })

  // Company info — right-aligned under badge
  let cy = 82
  const companyLines = [
    s.company_name,
    s.company_address,
    s.company_phone ? `Tel: ${s.company_phone}` : null,
    s.company_email ? `Email: ${s.company_email}` : null,
  ].filter(Boolean)

  for (const line of companyLines) {
    doc.fillColor(DARK).fontSize(8).font('Helvetica')
       .text(line, 50, cy, { width: PAGE_W, align: 'right' })
    cy += 11
  }

  const headerBottom = Math.max(50 + logoH, cy) + 10
  doc.moveTo(50, headerBottom).lineTo(50 + PAGE_W, headerBottom).lineWidth(2).strokeColor(BLUE).stroke()

  // ── CUSTOMER & QUOTE META ────────────────────────────────────────────────
  const infoTop = headerBottom + 16
  const halfW   = PAGE_W / 2

  // Left: bill-to block
  doc.fillColor(BLUE).fontSize(7.5).font('Helvetica-Bold').text('BILL TO', 50, infoTop)
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text(quote.customer_name, 50, infoTop + 13)
  if (quote.customer_address) {
    doc.fillColor(MID).fontSize(8.5).font('Helvetica')
       .text(quote.customer_address, 50, doc.y + 3, { width: halfW - 20 })
  }

  // Right: meta table
  const metaX = 50 + halfW + 20
  const metaRows = [
    ['Quote Number', quote.quote_number],
    ['Date',         quote.date],
    ['Type',         installLabel(quote.installation_type)],
    ['Status',       (quote.status || 'draft').charAt(0).toUpperCase() + (quote.status || 'draft').slice(1)],
  ]

  let my = infoTop
  for (const [label, val] of metaRows) {
    doc.fillColor(MID).fontSize(8).font('Helvetica').text(label, metaX, my, { width: 90 })
    doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold').text(val, metaX + 95, my, { width: halfW - 115 })
    my += 16
  }

  doc.y = Math.max(doc.y, my) + 18

  // ── LINE ITEMS TABLE ─────────────────────────────────────────────────────
  const col = {
    desc:  { x: 50,                  w: PAGE_W * 0.50 },
    qty:   { x: 50 + PAGE_W * 0.50,  w: PAGE_W * 0.12 },
    unit:  { x: 50 + PAGE_W * 0.62,  w: PAGE_W * 0.19 },
    total: { x: 50 + PAGE_W * 0.81,  w: PAGE_W * 0.19 },
  }

  // Table header
  const tableTop = doc.y
  doc.rect(50, tableTop, PAGE_W, 22).fill(BLUE)
  doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
  doc.text('DESCRIPTION',  col.desc.x + 6,  tableTop + 7, { width: col.desc.w - 6 })
  doc.text('QTY',          col.qty.x,        tableTop + 7, { width: col.qty.w,  align: 'center' })
  doc.text('UNIT PRICE',   col.unit.x,       tableTop + 7, { width: col.unit.w, align: 'right' })
  doc.text('LINE TOTAL',   col.total.x,      tableTop + 7, { width: col.total.w - 5, align: 'right' })

  let rowY  = tableTop + 22
  let rowAlt = false

  function addPageBreakIfNeeded() {
    if (rowY > doc.page.height - 180) {
      doc.addPage()
      rowY = 50
      rowAlt = false
    }
  }

  function sectionRow(label) {
    addPageBreakIfNeeded()
    doc.rect(50, rowY, PAGE_W, 20).fill(LIGHT_BLUE)
    doc.fillColor(BLUE).fontSize(8).font('Helvetica-Bold')
       .text(label, col.desc.x + 6, rowY + 6, { width: PAGE_W - 12 })
    doc.moveTo(50, rowY + 20).lineTo(50 + PAGE_W, rowY + 20).lineWidth(0.5).strokeColor(BORDER).stroke()
    rowY += 20
    rowAlt = false
  }

  function dataRow(desc, qty, unitPrice, lineTotal) {
    addPageBreakIfNeeded()
    const h = 18
    if (rowAlt) doc.rect(50, rowY, PAGE_W, h).fill(GREY_BG)
    doc.fillColor(DARK).fontSize(8).font('Helvetica')
       .text(desc, col.desc.x + 6, rowY + 5, { width: col.desc.w - 10 })
    if (qty !== null)
      doc.text(String(qty), col.qty.x, rowY + 5, { width: col.qty.w, align: 'center' })
    if (unitPrice !== null)
      doc.text(fmt(unitPrice), col.unit.x, rowY + 5, { width: col.unit.w, align: 'right' })
    doc.text(fmt(lineTotal), col.total.x, rowY + 5, { width: col.total.w - 5, align: 'right' })
    doc.moveTo(50, rowY + h).lineTo(50 + PAGE_W, rowY + h).lineWidth(0.3).strokeColor(BORDER).stroke()
    rowY  += h
    rowAlt = !rowAlt
  }

  // ── Units
  const units = Array.isArray(quote.units) ? quote.units.filter(u => u.description) : []
  if (units.length) {
    sectionRow('AC Units & Equipment')
    for (const u of units) {
      const qty  = parseFloat(u.qty)       || 1
      const up   = parseFloat(u.unit_price) || 0
      dataRow(u.description, qty, up, qty * up)
    }
  }

  // ── Pipework
  const pw = quote.pipework || {}
  if (parseFloat(pw.metres) > 0) {
    sectionRow('Pipework & Refrigerant Lines')
    const m    = parseFloat(pw.metres)          || 0
    const rate = parseFloat(pw.price_per_metre) || 0
    dataRow(`Pipework run — ${m}m @ ${fmt(rate)}/m`, m, rate, m * rate)
  }

  // ── Electrical
  const el = quote.electrical || {}
  if (el.description || parseFloat(el.cost) > 0) {
    sectionRow('Electrical Works')
    dataRow(el.description || 'Electrical installation works', 1, parseFloat(el.cost) || 0, parseFloat(el.cost) || 0)
  }

  // ── Labour
  const lab = quote.labour || {}
  if (parseFloat(lab.hours) > 0) {
    sectionRow('Labour')
    const hrs  = parseFloat(lab.hours) || 0
    const rate = parseFloat(lab.rate)  || 0
    dataRow(`Installation labour — ${hrs} hrs @ ${fmt(rate)}/hr`, hrs, rate, hrs * rate)
  }

  // ── Consumables
  const cons = quote.consumables || {}
  const consVal = parseFloat(cons.value) || 0
  if (consVal > 0) {
    sectionRow('Consumables & Sundry Materials')
    if (cons.type === 'percentage') {
      const amount = (parseFloat(quote.subtotal) || 0) * (consVal / 100)
      dataRow(`Consumables (${consVal}% of parts & materials)`, null, null, amount)
    } else {
      dataRow('Consumables & sundry materials', 1, consVal, consVal)
    }
  }

  // ── TOTALS BLOCK ─────────────────────────────────────────────────────────
  addPageBreakIfNeeded()
  doc.y = rowY + 14

  const includeVat = s.include_vat === 'true'
  const vatRate    = parseFloat(s.vat_rate || '20') / 100
  const subtotal   = parseFloat(quote.subtotal || 0)
  const total      = parseFloat(quote.total    || 0)
  const vatAmount  = subtotal * vatRate

  const totLabelX = col.unit.x
  const totValX   = col.total.x
  const totLabelW = col.unit.w
  const totValW   = col.total.w - 5

  function totRow(label, val, bold = false) {
    const ty   = doc.y
    const font = bold ? 'Helvetica-Bold' : 'Helvetica'
    const sz   = bold ? 10 : 8.5
    doc.fillColor(bold ? DARK : MID).fontSize(sz).font(font)
       .text(label, totLabelX, ty, { width: totLabelW, align: 'right' })
    doc.text(fmt(val), totValX, ty, { width: totValW, align: 'right' })
    doc.y = ty + (bold ? 20 : 15)
  }

  totRow('Subtotal', subtotal)
  if (includeVat) {
    totRow(`VAT (${s.vat_rate}%)`, vatAmount)
    // box around the grand total line
    const boxY = doc.y
    doc.rect(totLabelX - 6, boxY - 4, totLabelW + totValW + 6 + 5, 26).stroke(BLUE)
    totRow('TOTAL (inc. VAT)', total, true)
  } else {
    const boxY = doc.y
    doc.rect(totLabelX - 6, boxY - 4, totLabelW + totValW + 6 + 5, 26).stroke(BLUE)
    totRow('TOTAL', total, true)
  }

  // ── NOTES ────────────────────────────────────────────────────────────────
  if (quote.notes && quote.notes.trim()) {
    doc.y += 16
    doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('NOTES')
    doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
       .text(quote.notes.trim(), { width: PAGE_W })
  }

  // ── TERMS & CONDITIONS ───────────────────────────────────────────────────
  if (s.terms_and_conditions && s.terms_and_conditions.trim()) {
    doc.y += 18
    doc.moveTo(50, doc.y).lineTo(50 + PAGE_W, doc.y).lineWidth(0.8).strokeColor(BORDER).stroke()
    doc.y += 10
    doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('TERMS & CONDITIONS')
    doc.fillColor(MID).fontSize(7.5).font('Helvetica')
       .text(s.terms_and_conditions.trim(), { width: PAGE_W })
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = doc.page.height - 45
  doc.moveTo(50, footerY).lineTo(50 + PAGE_W, footerY).lineWidth(0.5).strokeColor(BORDER).stroke()
  doc.fillColor(MID).fontSize(7).font('Helvetica')
     .text(
       `${s.company_name || 'AC Quote Builder'}  ·  Quote ${quote.quote_number}  ·  Generated ${new Date().toLocaleDateString('en-GB')}`,
       50, footerY + 8, { width: PAGE_W, align: 'center' },
     )
}

module.exports = router
