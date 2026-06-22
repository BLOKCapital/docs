# Build & Scripts

Every npm script, every build-time script, and the artifacts they produce.
Sourced from [package.json](../package.json) and [scripts/](../scripts/).

## Requirements

- **Node.js >= 20** (`engines` in [package.json](../package.json)).
- npm (the repo ships a `package-lock.json`; use `npm ci` for reproducible installs).

## npm scripts

| Script | Command | What it does |
|--------|---------|--------------|
| `dev` | `next dev` | Dev server on `http://localhost:3000`. |
| `predev` | `tsx scripts/build-search-index.ts && tsx scripts/build-llms.ts` | Auto-runs **before** `dev`; regenerates the search index + `llms.txt`. |
| `build` | `next build` | Full production build → static export of all routes. |
| `prebuild` | `tsx scripts/build-search-index.ts && tsx scripts/build-llms.ts` | Auto-runs **before** `build`; keeps generated artifacts fresh. |
| `start` | `next start` | Serves the production build. |
| `lint` | `next lint` | ESLint (`next/core-web-vitals` + `next/typescript`). |
| `typecheck` | `tsc --noEmit` | Type-checks the whole project (including `scripts/*.ts`). |
| `search:index` | `tsx scripts/build-search-index.ts` | Rebuild search JSON only. |
| `llms` | `tsx scripts/build-llms.ts` | Rebuild `llms.txt` + `llms-full.txt` only. |
| `check:content` | `tsx scripts/check-content.ts` | Validate frontmatter, links, locale parity, config drift. |

`predev` and `prebuild` are npm **lifecycle hooks** — npm runs them automatically
before `dev`/`build`; you don't call them directly.

## Why `tsx`

The build scripts are TypeScript and are executed with
[`tsx`](https://github.com/privatenumber/tsx) (a dev dependency). `tsx` runs `.ts`
files directly on Node 18+, which keeps the scripts runnable on the project's
declared floor (Node 20) and in CI without a separate compile step. Native Node
type-stripping is not relied upon because it is unavailable on Node 20.

## The scripts

All live in [scripts/](../scripts/) and share helpers from `_content.ts`.

### `_content.ts` — shared helpers

[scripts/_content.ts](../scripts/_content.ts). Not executed directly; imported by
the others. Provides:

- `ROOT`, `CONTENT` — absolute paths.
- `LOCALES`, `SECTIONS` — **mirrors** of the runtime values in
  [src/lib/config.ts](../src/lib/config.ts). `check-content.ts` asserts they stay
  in sync.
- `walkLocale(locale)` — walks `content/<locale>/**` and returns a `ScriptDoc[]`
  (`{ locale, section, segments, href, file, data, content }`).
- `titleFromSlug`, `toPlainText`, `collectHeadings` — text utilities used to build
  the search index and `llms.txt`.

Exposed types: `Locale`, `SectionSlug`, `Frontmatter`, `Heading`, `ScriptDoc`.

### `build-search-index.ts` — search index generator

[scripts/build-search-index.ts](../scripts/build-search-index.ts).

- **Input:** `content/<locale>/<section>/**`.
- **Output:** `public/search/<locale>.json` — a flat array of records:
  ```ts
  { id, href, title, section, description,
    headings: { text, slug }[],   // h2/h3 anchors → deep links
    text }                        // plain-text body, capped at 4000 chars
  ```
- The client builds its FlexSearch index from this file at runtime
  ([SearchDialog.tsx](../src/components/search/SearchDialog.tsx)).

### `build-llms.ts` — AI/answer-engine corpus

[scripts/build-llms.ts](../scripts/build-llms.ts). Implements the
[llms.txt convention](https://llmstxt.org). Uses the **English** locale (the
canonical set).

- **`public/llms.txt`** — a curated index: site summary + every doc grouped by
  section as Markdown links with one-line descriptions (frontmatter
  `description`, else a generated first-paragraph excerpt).
- **`public/llms-full.txt`** — the full English corpus concatenated as clean
  Markdown, so an agent can ingest all docs in one fetch.

### `check-content.ts` — content validator

[scripts/check-content.ts](../scripts/check-content.ts). Run in CI. See
[CONTENT_AUTHORING.md](CONTENT_AUTHORING.md#validation) for the full rule list.
Exits non-zero on any error. Notably also guards against `LOCALES`/`SECTIONS`
drift between the scripts and `config.ts`.

### `migrate-content.ts` — one-shot importer

[scripts/migrate-content.ts](../scripts/migrate-content.ts). A **one-time**
migration that imported the original Docusaurus content into this repo's
`content/<locale>/<section>` layout. Not part of the normal build.

```bash
npx tsx scripts/migrate-content.ts "<path to old documentation repo>"
```

It normalizes frontmatter (`sidebar_position` → `position`), derives titles from
a leading `# H1` and strips it, converts `:::kind` admonitions to `<Admonition>`,
drops `@site` imports, converts HTML comments to MDX comments, rewrites
section-prefixed links and strips `.md(x)` extensions, copies `_category_.json` →
`_category.json`, and copies `static/img` → `public/img`.

## Generated artifacts (committed)

These are produced by the scripts and live under [public/](../public/):

| Artifact | Producer | Served at |
|----------|----------|-----------|
| `public/search/en.json`, `es.json`, `fr.json` | `build-search-index.ts` | `/search/<locale>.json` |
| `public/llms.txt` | `build-llms.ts` | `/llms.txt` |
| `public/llms-full.txt` | `build-llms.ts` | `/llms-full.txt` |

Because the `predev`/`prebuild` hooks regenerate them, you generally don't need to
commit them by hand — but they are tracked so the deployed site is correct even
on hosts that don't run the hooks. `next build` also emits `robots.txt`,
`sitemap.xml`, `manifest.webmanifest`, and the `opengraph-image` from the
metadata routes (see [SEO_AEO.md](SEO_AEO.md)).

## Typical local loop

```bash
npm ci                 # clean install from lockfile
npm run check:content  # validate before you build
npm run dev            # iterate (hooks refresh the index automatically)

# before pushing:
npm run typecheck && npm run lint && npm run build
```
