#!/usr/bin/env node
/**
 * Uploads the Digital Library PDFs to the Internet Archive, one item per publication,
 * with metadata built from content/library/*.yml.
 *
 *   node scripts/ia-upload.mjs                 dry run: builds the plan, checks identifiers,
 *                                              writes ia-upload-plan.json — uploads nothing
 *   node scripts/ia-upload.mjs --go            upload every item not uploaded yet
 *   node scripts/ia-upload.mjs --go --only 1   upload a single publication (by legacyId)
 *
 * Throttling: pauses --pause seconds between uploads (default 90), checks the IA
 * rate limit before each upload and waits while over it (up to --max-wait minutes,
 * default 120), and retries a failed upload twice after 10 minutes.
 *
 * Requires the `ia` CLI (brew install internetarchive) configured with S3 keys in
 * ~/.config/internetarchive/ia.ini. After each successful upload, `archiveId` is written
 * into that publication's YAML file, so re-running skips items already done.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const LIB = join(ROOT, 'content/library')
const PDF = join(ROOT, 'pdf')
const GO = process.argv.includes('--go')
const arg = (name, fallback) => process.argv.includes(name) ? Number(process.argv[process.argv.indexOf(name) + 1]) : fallback
const ONLY = arg('--only', null)
const PAUSE_S = arg('--pause', 90) // seconds between uploads
const WAIT_MAX_MIN = arg('--max-wait', 120) // give up if still rate-limited after this many minutes
const PREFIX = 'robertwillis2016'
const sleep = ms => new Promise(r => setTimeout(r, ms))

const SITE_NOTE = 'Digitised copy compiled for the Robert Willis 2016 Symposium Digital Library '
  + '(Robert Willis, 1800–1875: Science, Technology and Architecture in the 19th Century; '
  + 'Gonville and Caius College, Cambridge, 16–17 September 2016), formerly published at robertwillis2016.org/Library/.'

// Library-catalogue forms of the author names that occur in the data.
const CREATORS = {
  'Robert Willis': 'Willis, Robert, 1800-1875',
  'John Henry Parker': 'Parker, John Henry, 1806-1884',
  'J. Stewart': 'Stewart, J.',
  'John Willis Clark': 'Clark, John Willis, 1833-1910',
}
// Per-publication additions that the database does not hold (from the PDF filenames).
const EXTRA = {
  27: { volume: 'Vol. 1 (Text)' },
  28: { volume: 'Vol. 2, Plates, Part 1' },
  36: { creators: ['Robert Willis'] }, // author missing in DB; filename "1862_Willis_Address…"
  42: { edition: '2nd edition' },
  // completed and edited by his nephew (filenames "…Willis_Clark…")
  43: { volume: 'Vol. 1', creators: ['Robert Willis', 'John Willis Clark'] },
  44: { volume: 'Vol. 2', creators: ['Robert Willis', 'John Willis Clark'] },
  45: { volume: 'Vol. 3', creators: ['Robert Willis', 'John Willis Clark'] },
  46: { volume: 'Vol. 4 (Plates)', creators: ['Robert Willis', 'John Willis Clark'] },
  48: { edition: '1910 edition' },
  49: { subjectPerson: true }, // memoir *about* Willis
}
const LANG = { 3: 'ger', 13: 'ger', 15: 'fre' }

const ARCH = /cathedral|architect|vault|gothic|minster|abbey|church|monaster|barn|crypt|moulding|nomenclature|glossary|sketch-book|seal|fabric|flamboyant|sepulchre|foundations/i
const MECH = /mechani|wheel|tool|machine|apparatus|pressure|larynx|vowel|vocal|elastic|cymagraph|chess|organ|metal|lectures|science/i

// ---------- read YAML ----------
const field = (yml, k) => {
  const m = yml.match(new RegExp(`^${k}: (.*)$`, 'm'))
  return !m || m[1] === 'null' ? null : JSON.parse(m[1])
}
const entries = readdirSync(LIB).filter(f => f.endsWith('.yml')).map((name) => {
  const y = readFileSync(join(LIB, name), 'utf8')
  return {
    yml: name,
    id: field(y, 'legacyId'), year: field(y, 'year'), title: field(y, 'title'),
    author: field(y, 'author'), publication: field(y, 'publication'),
    file: field(y, 'file'), hidden: field(y, 'hidden'), archiveId: field(y, 'archiveId'),
  }
}).filter(e => !e.hidden && e.file).sort((a, b) => a.year - b.year || a.id - b.id)

// ---------- build plan ----------
const slug = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b(a|an|the|of|on|in|and|for|to|with|de|des|le|la|die|der|im|und|especially|those|lately|recently)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 6).join('-')
  .replace(/-(at|by|from|other)$/, '')

function plan(e) {
  const x = EXTRA[e.id] ?? {}
  const names = x.creators ?? (e.author ? e.author.split(/,\s*/) : [])
  const creators = names.map(n => CREATORS[n] ?? n)
  const label = [x.volume, x.edition].filter(Boolean).join(', ')
  const title = label ? `${e.title}. ${label}` : e.title
  const volSlug = x.volume ? `-vol${x.volume.match(/\d/)[0]}` : x.edition?.startsWith('2nd') ? '-2nd-ed' : ''
  const identifier = `${PREFIX}-${e.year}-${slug(e.title)}${volSlug}`.slice(0, 90)

  const subjects = ['Willis, Robert, 1800-1875', 'Robert Willis', '19th century']
  if (ARCH.test(e.title)) subjects.push('Architecture, Medieval', 'Architectural history')
  if (MECH.test(e.title)) subjects.push('Mechanical engineering', 'History of science and technology')

  const description = [
    e.publication && `<p><i>${e.publication}</i></p>`,
    label && !/\bvol/i.test(e.publication ?? '') && `<p>${label}.</p>`,
    `<p>${SITE_NOTE}</p>`,
  ].filter(Boolean).join('')

  const metadata = {
    mediatype: 'texts',
    collection: 'opensource',
    title,
    creator: creators,
    date: String(e.year),
    language: LANG[e.id] ?? 'eng',
    subject: subjects,
    description,
    licenseurl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    contributor: 'Robert Willis 2016 Symposium – Digital Library',
    source: `http://robertwillis2016.org/Library/pdf/${encodeURIComponent(e.file)}`,
  }
  return { ...e, identifier, metadata, path: join(PDF, e.file) }
}

const items = entries.map(plan).filter(p => ONLY == null || p.id === ONLY)

// sanity checks
const ids = new Map()
for (const p of items) {
  if (ids.has(p.identifier)) throw new Error(`Duplicate identifier ${p.identifier} (#${ids.get(p.identifier)} and #${p.id})`)
  ids.set(p.identifier, p.id)
  if (!/^[A-Za-z0-9][\w.-]{4,99}$/.test(p.identifier)) throw new Error(`Invalid identifier ${p.identifier}`)
  if (!existsSync(p.path)) throw new Error(`Missing PDF for #${p.id}: ${p.file}`)
}

async function itemState(identifier) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(`https://archive.org/metadata/${identifier}`, { headers: { 'User-Agent': 'robertwillis-ia-upload/1.0' } })
      const j = await r.json()
      if (!j || !Object.keys(j).length) return { exists: false }
      return { exists: true, uploader: j.metadata?.uploader, files: (j.files ?? []).map(f => f.name) }
    } catch { await sleep(2000) }
  }
  return { exists: null }
}

// ---------- dry run ----------
if (!GO) {
  const rows = []
  let clash = 0
  for (const p of items) {
    const s = await itemState(p.identifier)
    const status = p.archiveId ? 'done' : s.exists === false ? 'free' : s.exists ? 'TAKEN' : 'unknown'
    if (status === 'TAKEN') clash++
    rows.push({ ...p, status })
    console.log(`${status.padEnd(7)} #${String(p.id).padStart(2)} ${(statSync(p.path).size / 1e6).toFixed(1).padStart(6)} MB  ${p.identifier}`)
    await sleep(150)
  }
  writeFileSync(join(ROOT, 'ia-upload-plan.json'), JSON.stringify(rows.map(({ path, yml, ...r }) => r), null, 2))
  const total = items.reduce((t, p) => t + statSync(p.path).size, 0)
  console.log(`\n${items.length} items, ${(total / 1e9).toFixed(2)} GB. Identifiers taken by someone else: ${clash}.`)
  console.log('Full metadata: ia-upload-plan.json — nothing was uploaded. Run with --go to upload.')
  process.exit(clash ? 1 : 0)
}

// ---------- upload ----------
const which = spawnSync('ia', ['--version'], { encoding: 'utf8' })
if (which.status !== 0) throw new Error('`ia` CLI not found — brew install internetarchive')

// S3 keys (for the rate-limit check only; never printed)
function s3Keys() {
  const ini = readFileSync(join(homedir(), '.config/internetarchive/ia.ini'), 'utf8')
  const get = k => ini.match(new RegExp(`^\\s*${k}\\s*=\\s*(\\S+)`, 'm'))?.[1]
  return { access: get('access'), secret: get('secret') }
}
const KEYS = s3Keys()
const hhmm = () => new Date().toTimeString().slice(0, 5)

/** Asks the IA S3 endpoint whether this account/bucket is currently throttled. */
async function overLimit(bucket) {
  const q = new URLSearchParams({ check_limit: '1', accesskey: KEYS.access, bucket })
  try {
    const r = await fetch(`https://s3.us.archive.org/?${q}`, {
      headers: { authorization: `LOW ${KEYS.access}:${KEYS.secret}`, 'User-Agent': 'robertwillis-ia-upload/1.0' },
    })
    const j = await r.json()
    return { over: !!j.over_limit, queued: j.detail?.accesskey_tasks_queued ?? '?' }
  } catch { return { over: false, queued: '?' } } // don't block on a failed check
}

/** Waits (up to WAIT_MAX_MIN) until the account is no longer rate-limited. */
async function waitForCapacity(bucket) {
  const start = Date.now()
  for (;;) {
    const { over, queued } = await overLimit(bucket)
    if (!over) return true
    const waited = Math.round((Date.now() - start) / 60000)
    if (waited >= WAIT_MAX_MIN) return false
    console.log(`  ⏸  ${hhmm()} archive.org asks to slow down (${queued} of your tasks queued) — waiting 5 min…`)
    await sleep(5 * 60_000)
  }
}

let uploaded = 0
for (const p of items) {
  if (p.archiveId) { console.log(`skip   #${p.id} already uploaded → ${p.archiveId}`); continue }
  const s = await itemState(p.identifier)
  if (s.exists && s.files?.includes(p.file)) {
    console.log(`exists #${p.id} ${p.identifier} (file already there) — recording archiveId`)
  } else {
    if (uploaded > 0 && PAUSE_S > 0) {
      console.log(`  …  ${hhmm()} pausing ${PAUSE_S}s between items`)
      await sleep(PAUSE_S * 1000)
    }
    const args = ['upload', p.identifier, p.path, '--retries', '20', '--sleep', '60', '--checksum']
    for (const [k, v] of Object.entries(p.metadata))
      for (const val of [v].flat()) args.push(`--metadata=${k}:${val}`)

    let ok = false
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      if (!await waitForCapacity(p.identifier)) {
        console.error(`✖ still rate-limited after ${WAIT_MAX_MIN} min; stopping. Re-run later to resume.`)
        process.exit(1)
      }
      console.log(`upload #${p.id} ${p.identifier} (${(statSync(p.path).size / 1e6).toFixed(1)} MB)${attempt > 1 ? ` — attempt ${attempt}/3` : ''} [${hhmm()}]…`)
      ok = spawnSync('ia', args, { stdio: 'inherit' }).status === 0
      if (!ok && attempt < 3) {
        console.log(`  ⚠  ${hhmm()} upload failed — waiting 10 min before retrying #${p.id}`)
        await sleep(10 * 60_000)
      }
    }
    if (!ok) { console.error(`✖ upload failed 3 times for #${p.id}; stopping. Re-run to resume.`); process.exit(1) }
    uploaded++
  }
  const ymlPath = join(LIB, p.yml)
  const y = readFileSync(ymlPath, 'utf8')
  if (!/^archiveId:/m.test(y))
    writeFileSync(ymlPath, y.replace(/^(file: .*)$/m, `$1\narchiveId: ${JSON.stringify(p.identifier)}`))
  console.log(`✔ #${p.id} → https://archive.org/details/${p.identifier}`)
}
console.log('\nDone. Items can take a while to finish processing (OCR, reader) on archive.org.')
