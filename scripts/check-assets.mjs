#!/usr/bin/env node
/**
 * Lists files referenced by content/library/*.yml that are missing from public/.
 * Covers are required (exit 1). PDFs only warn: they are added to public/Library/pdf/
 * separately (not in git) or uploaded straight to the host.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIR = join(ROOT, 'content/library')
const field = (yml, k) => {
  const m = yml.match(new RegExp(`^${k}: (.*)$`, 'm'))
  return !m || m[1] === 'null' ? null : JSON.parse(m[1])
}

const missingCovers = [], missingPdfs = []
let visible = 0
for (const f of readdirSync(DIR).filter(f => f.endsWith('.yml'))) {
  const yml = readFileSync(join(DIR, f), 'utf8')
  if (field(yml, 'hidden') === true) continue
  visible++
  const cover = field(yml, 'cover'), file = field(yml, 'file')
  if (cover && !existsSync(join(ROOT, 'public/Library/img', cover))) missingCovers.push(cover)
  if (file && !existsSync(join(ROOT, 'public/Library/pdf', file))) missingPdfs.push(file)
}

console.log(`[check-assets] ${visible} visible publications`)
if (missingPdfs.length)
  console.warn(`[check-assets] ⚠ ${missingPdfs.length}/${visible} PDFs not in public/Library/pdf/ (download links will 404 unless uploaded to the host separately)`)
else console.log('[check-assets] all PDFs present')
if (missingCovers.length) {
  console.error(`[check-assets] ✖ missing covers:\n  ${missingCovers.join('\n  ')}`)
  process.exit(1)
}
console.log('[check-assets] all covers present')
