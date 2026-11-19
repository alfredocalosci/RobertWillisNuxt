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
| `public/Library/pdf/` | Library PDFs (~2.9 GB). **Not in git.** See below |

`scripts/import-library.mjs` is the one-off migration from the legacy dump. It is kept for reference:
`node scripts/import-library.mjs ../RobertWillis`

## Library PDFs

The PDFs are too large for git (some are over 100 MB) and are ignored. Either:

- copy them into `public/Library/pdf/` before `npm run generate`, or
- upload them straight to the host at `/Library/pdf/`.

`npm run check:assets` (also run automatically before `generate`) reports any missing files.
If the PDFs move elsewhere, set `runtimeConfig.public.pdfBaseUrl` in `nuxt.config.ts`.

## URLs

The original URLs are preserved: `/`, `/about`, `/Library/` (Digital Library), `/Library/pdf/<file>`.
`/index.html` and `/about.html` redirect. On Apache, `public/.htaccess` adds real 301s.

## Deploy

Upload the contents of `.output/public` to any static host.
