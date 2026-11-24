# CLAUDE.md

Static archive site for the **Robert Willis (1800–1875) 2016 Symposium** and its **Digital Library** of Willis's publications as PDFs. The site is **frozen**: no new content is expected, so changes are maintenance or fixes. Keep the 2016 look.

Stack: Nuxt 4 · @nuxt/content v3 (better-sqlite3) · @nuxt/ui v4 (Tailwind v4) · npm. Output is fully static (`nuxt generate`).

## Commands

```bash
npm run dev             # dev server, http://localhost:3000
npm run generate        # static build → .output/public (runs check:assets first)
npm run check:assets    # fails on missing covers / archiveId; regenerates PDF 301s in public/.htaccess
npm run ia:plan         # dry run: Internet Archive metadata for entries without archiveId
npm run ia:upload -- --pause 600   # upload those to archive.org (ia CLI), write archiveId into YAML
npm run find:pdfs       # searches Internet Archive (by title/author/year) for missing PDFs → missing-pdfs-report.md
npx serve .output/public
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json   # type check
```

Deploy by uploading the contents of `.output/public` to any static host. The host is not decided yet: static.app, or an Apache host where `public/.htaccess` applies.

## Structure

```
app/
  pages/index.vue           /          symposium (cover, call, programme, venue, flyer)
  pages/about.vue           /about     about Willis (this web site, life and works)
  pages/Library/index.vue   /Library/  Digital Library (capital L, see Gotchas)
  components/
    SitePage.vue            page shell: SiteSidebar + <main> + SiteFooter
    SiteSidebar.vue         fixed 320px left nav at ≥1200px (was #fijo); scroll-spied section links
    SiteCover.vue           title + page links below 1200px (was #cover / #blocks)
    SiteTitle.vue           "1800 - 1875 / Robert Willis / Science Technology…" block
    SectionProse.vue        renders content/sections/<path>.md (props: drop-cap, large)
    LibraryList.vue         search + sort (replaces list.js)
    LibraryItem.vue         one publication row, schema.org Book microdata
    SlideShow.vue / SlidePager.vue   home slideshow (replaces jquery.cycle2)
    content/ContentFigure.vue        MDC ::content-figure{src alt} for Markdown
  composables/useScrollSpy.ts       current section at 25% of viewport (replaces jquery.nav)
  utils/site.ts             SITE_PAGES (nav), CONTACT_EMAIL
  assets/css/main.css       design tokens (@theme) + base typography + .sezione/.row/.sez/.cloud…
shared/types/site.ts        SectionLink, SitePageKey
content/
  library/*.yml             one file per publication (collection `library`)
  sections/{home,about,library}/*.md   page prose (collection `sections`)
  programme.yml             symposium speakers by theme (collection `programme`)
public/
  img/                      site images and download icons
  Library/img/              library cover thumbnails (committed)
  .htaccess                 Apache only: legacy 301s (incl. generated /Library/pdf/* → archive.org) + pretty URLs
pdf/                        local master PDFs, ~3 GB, GITIGNORED, not deployed (served from archive.org)
scripts/
  import-library.mjs        one-off MySQL → YAML migration (history, see below)
  check-assets.mjs          cover/archiveId check + .htaccess PDF redirects (pregenerate hook)
  ia-upload.mjs             uploads pdf/<file> to the Internet Archive, one item per publication
  find-missing-pdfs.mjs     Internet Archive candidate report for missing PDFs (read-only, no downloads)
```

## Content model

`content.config.ts` defines the collections. A library entry looks like this:

```yaml
legacyId: 1            # id_lib, tie-break for ordering and stable key
year: 1821             # anno_lib
author: "Robert Willis"          # nullable
title: "An attempt to Analyse the Automaton Chess Player"
publication: "London: Booth"     # txt_lib, nullable
category: "Science and technology"  # cat_lib, nullable, currently unused in UI
file: "1821_Willis_….pdf"        # filename in pdf/ and inside the archive.org item
archiveId: "robertwillis2016-1821-attempt-analyse-automaton-chess-player"
                                 # → https://archive.org/download/<archiveId>/<encodeURIComponent(file)>
cover: "1821.jpg"                # → /Library/img/<cover>
sizeMb: 25.9
hidden: false                    # hidden entries are kept but filtered out
```

- Files are named `<year>-<legacyId>-<slug>.yml`. The default order is year ascending, then legacyId, matching the old `ORDER BY anno_lib, id_lib`.
- To add or fix a publication, edit or add a YAML file, put the cover in `public/Library/img/`, and put the PDF in `pdf/`, run `npm run ia:upload` (it sets `archiveId`), then `npm run check:assets`.
- Section labels (the small italic `h2.sez` side headings) and the in-page nav lists live in the page `.vue` files, not in the Markdown.

## Conventions

- Nuxt 4 auto-imports: anything in `app/utils`, `app/composables` and `shared/types` is global, so don't add `import type` for `SectionLink`/`SitePageKey`.
- Tailwind breakpoints are overridden to Bootstrap 3 values: `xs` 481px, `sm` 768, `md` 992, `lg`/`xl` 1200 (fixed sidebar). Use them rather than adding custom media queries.
- Colour tokens: `blu` #325bae (links/accents), `slate`, `teal` #5fdee0, `ink` #333, `paper` #ebeff2 (background).
- Font: Alegreya, self-hosted at build time through @nuxt/fonts. It replaces the Adobe Typekit freight-text-pro.
- The design is light only (`colorMode` is forced light).
- Scripts are plain Node `.mjs` in `scripts/`, wired up as npm scripts.

## Gotchas

- **The `/Library/` casing is deliberate.** It is the original 2016 URL. A lowercase `/library` route collides with `Library/` on macOS's case-insensitive filesystem: the prerendered pages overwrite each other. Old `/Library/pdf/<file>` links 301 to archive.org on Apache only.
- **PDFs are never committed or deployed**: the repo is public and some files exceed GitHub's 100 MB limit. They live on the Internet Archive; `pdf/` is a gitignored local master copy. Never move them back into `public/` (it would add ~3 GB to every build).
- Internet Archive: the S3 keys live only in `~/.config/internetarchive/ia.ini` (chmod 600); never print or commit them. New accounts get rate-limited and spam-flagged on bursts of large uploads, so use `--pause 600`. After upload, items need hours to finish derive/OCR; the original PDF downloads work before that.
- PDF filenames must match `file:` exactly, including the original quirks: the space in `…in_the_year _1841_OCR.pdf`, and the commas in a few names. Links are URL-encoded.
- Legacy URLs: `/index.html` → `/` and `/about.html` → `/about` are prerendered meta-refresh redirects (`routeRules`). `.htaccess` also handles them, plus `/Library/index.php`, as real 301s on Apache.
- npm 11 `allowScripts` in `package.json` approves the install scripts for better-sqlite3, esbuild and vue-demi. A fresh install of a newer version may need `npm install-scripts approve <pkg>`.

## Migration history (2016 PHP/MySQL → Nuxt, Nov 2026)

The original site (`~/Sites/RobertWillis`, kept untouched as the reference) was built in 2016 with Bootstrap 3, jQuery plugins and Adobe Typekit:

| Original | Replaced by |
|---|---|
| `index.html`, `about.html` (static) | `app/pages/index.vue`, `about.vue`; prose → `content/sections/**.md`; speakers → `programme.yml` |
| `Library/index.php`: `SELECT * FROM library_rw WHERE hide_lib = 0 ORDER BY anno_lib, id_lib` via `Connections/RW.php` (mysqli) | `app/pages/Library/index.vue` + `queryCollection('library')` over `content/library/*.yml` |
| `css/my.css` (minified, hand-written) + Bootstrap 3 grid | Tailwind v4 `@theme` tokens and component classes in `app/assets/css/main.css`; 12-col CSS grid with 30px gutters |
| list.js (search, sort) | `LibraryList.vue` (accent-insensitive search on author/title/year; Year/Title/Author toggle asc/desc) |
| jquery.nav + scrollTo | `useScrollSpy` + CSS `scroll-behavior: smooth` |
| jquery.cycle2 slideshow | `SlideShow.vue` + `SlidePager.vue` (9s, pauses on hover, respects reduced motion) |
| Typekit freight-text-pro | Alegreya via @nuxt/fonts |
| Google Analytics UA-3945855-31 | dropped (UA is shut down) |

**Data migration.** `scripts/import-library.mjs` parsed the MySQL dump `zgr10oh_db1166fb.sql` (table `library_rw`, Jan 2024, **51 rows**: 48 visible, 3 hidden). It wrote one YAML file per row and copied the 48 referenced covers from `Library/img/`.
- The CSV export `docs/library_rw.csv` is an older 2016 snapshot (46 rows) and was only diffed against the dump. Since 2016, rows #19 and #30 were un-hidden, rows #47–51 were added, and #3's PDF was renamed to an `_OCR` version.
- Column mapping: `id_lib→legacyId`, `anno_lib→year`, `autor_lib→author`, `title_lib→title`, `txt_lib→publication`, `cat_lib→category` (`cat_num_lib` dropped), `file_lib→file`, `img_lib→cover`, `hide_lib→hidden`, `size_lib→sizeMb`.
- Re-running the script regenerates `content/library/` from scratch and overwrites any manual YAML edits. It is kept for reference only: `node scripts/import-library.mjs ../RobertWillis`.

**Content fixes made during the port:**
- Drop caps no longer duplicate the first letter (the old markup rendered "RRobert"). They are now `::first-letter`.
- A leftover Bootstrap sample caption ("A cheeky macaque… Borneo") under the roof-truss drawing on About was removed.
- "cdmon -" was removed from the home footer, and the sort label "Autor" became "Author".
- The home meta description now gives the correct dates (16–17 September 2016).

**Not migrated:** draft and template files (`template*.html`, `Library/index_static*.html`, `index_safe.php`, `test.php`), `Connections/RW.php`, which holds DB credentials in plain text and must **never** be copied into this repo, the SQL dump and CSV, Bootstrap/jQuery/FontAwesome assets, and 18 unreferenced images in the old `Library/img/`.
