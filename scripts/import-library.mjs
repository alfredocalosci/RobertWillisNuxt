#!/usr/bin/env node
/**
 * One-off migration: legacy MySQL `library_rw` table → content/library/*.yml
 *
 * Source of truth: the SQL dump (zgr10oh_db1166fb.sql, Jan 2024, 51 rows).
 * The older CSV export (docs/library_rw.csv, 2016, 46 rows) is only diffed
 * against it, for information.
 * Referenced cover images are copied to public/Library/img/.
 *
 * Usage: node scripts/import-library.mjs [path/to/old/RobertWillis]
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const OLD = resolve(process.argv[2] ?? '../RobertWillis')
const ROOT = resolve(import.meta.dirname, '..')
const OUT_DIR = join(ROOT, 'content/library')
const COVER_SRC = join(OLD, 'Library/img')
const COVER_DST = join(ROOT, 'public/Library/img')

// ---------- CSV ----------
function parseCsv(text, sep = ';') {
  const rows = []
  let row = [], field = '', quoted = false, wasQuoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') { quoted = true; wasQuoted = true }
    else if (c === sep) { row.push(wasQuoted ? field : field || null); field = ''; wasQuoted = false }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(wasQuoted ? field : field || null); rows.push(row)
      row = []; field = ''; wasQuoted = false
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...data] = rows.filter(r => r.length > 1)
  return data.map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? null])))
}

// ---------- SQL ----------
const COLS = ['id_lib', 'anno_lib', 'autor_lib', 'title_lib', 'txt_lib', 'cat_num_lib', 'cat_lib', 'file_lib', 'img_lib', 'hide_lib', 'size_lib']
function parseSqlRows(sql) {
  const rows = []
  for (const line of sql.split('\n')) {
    if (!line.startsWith('(')) continue
    const vals = []
    const re = /'((?:[^'\\]|\\.)*)'|(-?[\d.]+|NULL)/g
    let m
    while ((m = re.exec(line))) vals.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2] === 'NULL' ? null : m[2])
    if (vals.length !== COLS.length) throw new Error(`Unexpected column count in: ${line.slice(0, 80)}`)
    rows.push(Object.fromEntries(COLS.map((c, i) => [c, vals[i]])))
  }
  return rows
}

// ---------- helpers ----------
const slugify = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '')

// YAML scalar: always double-quote strings so colons, quotes and unicode are safe.
const yStr = v => v == null || v === '' ? 'null' : JSON.stringify(v)

// ---------- run ----------
const rows = parseSqlRows(readFileSync(join(OLD, 'zgr10oh_db1166fb.sql'), 'utf8'))
const csv = new Map(parseCsv(readFileSync(join(OLD, 'docs/library_rw.csv'), 'utf8')).map(r => [Number(r.id_lib), r]))
const covers = new Set(readdirSync(COVER_SRC))

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(COVER_DST, { recursive: true })

const warnings = []
const used = new Set()
const csvDiffs = []
for (const r of rows) {
  const id = Number(r.id_lib)
  const year = Number(r.anno_lib)
  const file = r.file_lib?.trim() || null
  const cover = r.img_lib?.trim() || null
  const hidden = r.hide_lib === '1'

  const old = csv.get(id)
  if (!old) csvDiffs.push(`#${id}: added after the 2016 CSV export`)
  else for (const k of ['title_lib', 'file_lib', 'img_lib', 'hide_lib'])
    if ((old[k] ?? '') !== (r[k] ?? '')) csvDiffs.push(`#${id}: ${k} changed since 2016: ${JSON.stringify(old[k])} → ${JSON.stringify(r[k])}`)

  if (file && /\s/.test(file)) warnings.push(`#${id}: whitespace in PDF filename: ${JSON.stringify(file)}`)
  if (!hidden && !file) warnings.push(`#${id}: visible but has no PDF`)
  if (cover) {
    if (covers.has(cover)) { copyFileSync(join(COVER_SRC, cover), join(COVER_DST, cover)); used.add(cover) }
    else warnings.push(`#${id}: cover not found in Library/img: ${cover}`)
  } else if (!hidden) warnings.push(`#${id}: visible but has no cover`)

  const name = `${year}-${String(id).padStart(3, '0')}-${slugify(r.title_lib)}.yml`
  writeFileSync(join(OUT_DIR, name), [
    `legacyId: ${id}`,
    `year: ${year}`,
    `author: ${yStr(r.autor_lib)}`,
    `title: ${yStr(r.title_lib)}`,
    `publication: ${yStr(r.txt_lib)}`,
    `category: ${yStr(r.cat_lib)}`,
    `file: ${yStr(file)}`,
    `cover: ${yStr(cover)}`,
    `sizeMb: ${Number(r.size_lib) || 0}`,
    `hidden: ${hidden}`,
    '',
  ].join('\n'))
}
console.log(`rows read from SQL dump: ${rows.length}`)
console.log(`yml written: ${readdirSync(OUT_DIR).length} → content/library/`)
console.log(`visible: ${rows.filter(r => r.hide_lib !== '1').length}, hidden: ${rows.filter(r => r.hide_lib === '1').length}`)
console.log(`covers copied: ${used.size} (unused in Library/img: ${[...covers].filter(c => !used.has(c) && !c.startsWith('.')).length})`)
console.log(`\nchanges vs 2016 CSV (info): ${csvDiffs.length}\n  ${csvDiffs.join('\n  ')}`)
console.log(warnings.length ? `\n${warnings.length} warning(s):\n  ${warnings.join('\n  ')}` : '\nno warnings')
