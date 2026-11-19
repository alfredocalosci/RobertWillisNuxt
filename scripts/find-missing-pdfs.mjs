#!/usr/bin/env node
/**
 * For each visible library entry whose PDF is missing from public/Library/pdf/,
 * search the Internet Archive by title/author/year (not by filename) and write a
 * Markdown report of ranked candidates, including whether each item offers a PDF.
 * Read-only: nothing is downloaded.
 *
 * Usage: node scripts/find-missing-pdfs.mjs [report.md]   (default: missing-pdfs-report.md)
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = resolve(process.argv[2] ?? join(ROOT, 'missing-pdfs-report.md'))
const UA = 'library-pdf-finder/1.0 (static archive maintenance script)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

const STOP = new Set(('a an and the of on in at to for from by with its his their or as be is are was were into over '
  + 'especially those which when lately recently vol de des le la du der die im und').split(' '))

const field = (yml, k) => {
  const m = yml.match(new RegExp(`^${k}: (.*)$`, 'm'))
  return !m || m[1] === 'null' ? null : JSON.parse(m[1])
}
const norm = s => (s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
const words = s => norm(s).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w))

// ---------- missing entries ----------
const dir = join(ROOT, 'content/library')
const missing = readdirSync(dir).filter(f => f.endsWith('.yml')).map((f) => {
  const y = readFileSync(join(dir, f), 'utf8')
  return {
    id: field(y, 'legacyId'), year: field(y, 'year'), title: field(y, 'title'),
    author: field(y, 'author'), publication: field(y, 'publication'),
    file: field(y, 'file'), hidden: field(y, 'hidden'),
  }
}).filter(e => !e.hidden && e.file && !existsSync(join(ROOT, 'public/Library/pdf', e.file)))
  .sort((a, b) => a.year - b.year)

// ---------- Internet Archive ----------
async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.ok) return await res.json()
      if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue }
      return null
    } catch { await sleep(2000 * (attempt + 1)) }
  }
  return null
}

async function search(q, rows = 15) {
  const p = new URLSearchParams({ q, rows: String(rows), output: 'json' })
  for (const f of ['identifier', 'title', 'creator', 'date', 'year', 'downloads', 'collection'])
    p.append('fl[]', f)
  const data = await getJson(`https://archive.org/advancedsearch.php?${p}`)
  return data?.response?.docs ?? []
}

async function pdfInfo(identifier) {
  const meta = await getJson(`https://archive.org/metadata/${encodeURIComponent(identifier)}`)
  const pdfs = (meta?.files ?? []).filter(f => /\.pdf$/i.test(f.name) && f.source !== 'derivative-ignored')
  if (!pdfs.length) return null
  const best = pdfs.toSorted((a, b) => Number(b.size ?? 0) - Number(a.size ?? 0))[0]
  return {
    name: best.name,
    mb: best.size ? Number(best.size) / 1e6 : null,
    url: `https://archive.org/download/${identifier}/${encodeURIComponent(best.name)}`,
    restricted: !!meta?.metadata?.['access-restricted-item'],
  }
}

function score(entry, doc) {
  const want = new Set(words(entry.title))
  const got = new Set(words([doc.title].flat().join(' ')))
  const overlap = [...want].filter(w => got.has(w)).length / Math.max(want.size, 1)
  const docYear = Number(String(doc.year ?? doc.date ?? '').slice(0, 4))
  const yearPts = !docYear ? 0 : docYear === entry.year ? 0.3 : Math.abs(docYear - entry.year) <= 2 ? 0.15 : 0
  const creator = norm([doc.creator].flat().join(' '))
  const authorPts = creator.includes('willis') ? 0.1 : 0
  return Math.round((overlap * 0.6 + yearPts + authorPts) * 100) / 100
}

function surname(entry) {
  // "Robert Willis" → willis; "J. Stewart, Robert Willis" → willis; file "…_Parker_Willis_…" → parker
  if (/_Parker_/.test(entry.file)) return 'parker'
  if (!entry.author || /willis/i.test(entry.author)) return 'willis'
  return norm(entry.author).split(/[\s,]+/).filter(Boolean).at(-1)
}

async function candidates(entry) {
  const kw = words(entry.title).slice(0, 7)
  const t = kw.join(' ')
  const s = surname(entry)
  const queries = [
    `title:(${t}) AND creator:(${s}) AND mediatype:texts`,
    `title:(${kw.slice(0, 4).join(' ')}) AND creator:(${s}) AND mediatype:texts`,
    `(${t}) AND (${s}) AND mediatype:texts`,
  ]
  const seen = new Map()
  for (const q of queries) {
    for (const d of await search(q)) if (!seen.has(d.identifier)) seen.set(d.identifier, d)
    if (seen.size >= 5) break
    await sleep(400)
  }
  const ranked = [...seen.values()]
    .map(d => ({ ...d, score: score(entry, d) }))
    .filter(d => d.score >= 0.35)
    .sort((a, b) => b.score - a.score || (b.downloads ?? 0) - (a.downloads ?? 0))
    .slice(0, 4)
  for (const d of ranked) { d.pdf = await pdfInfo(d.identifier); await sleep(300) }
  return ranked
}

// ---------- run ----------
const lines = [
  '# Missing library PDFs: Internet Archive candidates',
  '',
  `Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/find-missing-pdfs.mjs\`. `
  + `${missing.length} publications have no PDF. Score = title-word overlap (0.6) + same year (0.3, ±2y 0.15) + Willis as creator (0.1).`,
  '',
  'Check each candidate (edition, completeness, plates) before downloading. Save the chosen PDF as the **target filename** in `public/Library/pdf/`.',
  '',
]
let found = 0
for (const [i, e] of missing.entries()) {
  process.stdout.write(`[${i + 1}/${missing.length}] ${e.year} ${e.title.slice(0, 60)}… `)
  const c = await candidates(e)
  const withPdf = c.filter(d => d.pdf && !d.pdf.restricted)
  if (withPdf.length) found++
  console.log(withPdf.length ? `${withPdf.length} with PDF` : c.length ? 'matches, no open PDF' : 'none')

  lines.push(`## ${e.year} · ${e.title}`, '')
  lines.push(`- Author: ${e.author ?? '—'}${e.publication ? ` · _${e.publication}_` : ''}`)
  lines.push(`- Target filename: \`${e.file}\``, '')
  if (!c.length) { lines.push('_No candidates found._', ''); continue }
  lines.push('| Score | Item | Year | PDF |', '|---|---|---|---|')
  for (const d of c) {
    const title = [d.title].flat().join(' ').replace(/\|/g, '\\|').slice(0, 110)
    const year = String(d.year ?? d.date ?? '').slice(0, 4) || '?'
    const pdf = !d.pdf ? 'no PDF' : d.pdf.restricted ? 'lending only' : `[download](${d.pdf.url})${d.pdf.mb ? ` ${d.pdf.mb.toFixed(1)} MB` : ''}`
    lines.push(`| ${d.score} | [${title}](https://archive.org/details/${d.identifier}) | ${year} | ${pdf} |`)
  }
  lines.push('')
}
lines.splice(4, 0, `**${found} of ${missing.length}** have at least one candidate with an open PDF.`, '')
writeFileSync(OUT, lines.join('\n'))
console.log(`\n${found}/${missing.length} with an open PDF candidate → ${OUT}`)
