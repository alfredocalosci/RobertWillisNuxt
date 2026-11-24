# Robert Willis 2016 — Nuxt

Static rebuild of the *Robert Willis (1800–1875): Science, Technology and Architecture in the 19th Century* symposium site and its Digital Library. It was originally Bootstrap 3, jQuery and PHP/MySQL (2016).

Stack: Nuxt 4 · Nuxt Content v3 · Nuxt UI v4 (Tailwind v4) · fully static (`nuxt generate`).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # static site in .output/public
npx serve .output/public
```

## Content

| Path | What |
|---|---|
| `content/library/*.yml` | Digital Library, one file per publication (from MySQL `library_rw`) |
| `content/sections/**/*.md` | Prose of each page section |
| `content/programme.yml` | Symposium speakers and papers |
| `public/Library/img/` | Library cover images |
| `pdf/` | Local master copies of the library PDFs (~3 GB). **Not in git, not deployed.** See below |

`scripts/import-library.mjs` is the one-off migration from the legacy dump. It is kept for reference:
`node scripts/import-library.mjs ../RobertWillis`

## Library PDFs

The PDFs are served from the **Internet Archive**, one item per publication
(`https://archive.org/details/<archiveId>`). Each YAML entry's `archiveId` builds the download link
`https://archive.org/download/<archiveId>/<file>`. The site itself ships no PDFs.

- `pdf/` (gitignored) holds the local master copies, restored from Wayback captures of the 2016 site.
- `npm run ia:plan` shows what would be uploaded. `npm run ia:upload` uploads the items that have no
  `archiveId` yet, using the `ia` CLI configured in `~/.config/internetarchive/ia.ini`, and writes the
  `archiveId` back into the YAML. Add `-- --pause 600` to stay clear of the Archive's rate and spam limits.
- `npm run check:assets` (also run before `generate`) fails if a visible entry has no cover or no
  `archiveId`, and regenerates the Apache 301s for the old `/Library/pdf/<file>` URLs in `public/.htaccess`.

## URLs

The original URLs are preserved: `/`, `/about`, `/Library/` (Digital Library).
`/index.html` and `/about.html` redirect. On Apache, `public/.htaccess` adds real 301s, including
`/Library/pdf/<file>` → the PDF on archive.org.

## Deploy

Upload the contents of `.output/public` to any static host.
