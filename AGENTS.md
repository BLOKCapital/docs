# AGENTS.md

Operating guide for AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.)
working in this repository. Humans should start with [README.md](README.md);
deeper architecture lives in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Project overview

This repo is the source for the **BLOK Capital documentation site**
(`https://docs.blokcapital.io`) — a from-scratch **Next.js 15 (App Router) +
React 19 + TypeScript + Tailwind** app (no Docusaurus). It compiles **MDX**
documentation in **three locales** (`en`, `es`, `fr`) across **four sections**
(`concepts`, `smart-contracts`, `builders`, `resources`) into a fully
**static (SSG)**, SEO- and LLM-optimized site. It also emits agent-facing
artifacts: `llms.txt`, `llms-full.txt`, a Markdown twin of every page, and a
client search index.

## Setup & commands

- **Node ≥ 20** (`.nvmrc` → `20`). Install with `npm install`.
- `npm run dev` — local dev at `http://localhost:3000` (regenerates the search
  index, `llms.txt`, and Markdown twins via the `predev` hook first).
- `npm run build` — production build (same pre-generation, then `next build`).
- `npm run typecheck` — `tsc --noEmit` (covers `src/` **and** `scripts/`).
- `npm run lint` — ESLint (`next/core-web-vitals` + `next/typescript`).
- `npm run check:content` — validate frontmatter, internal links, locale parity.
- Regenerate single artifacts: `npm run search:index`, `npm run llms`, `npm run md`.

**Before committing**, run `npm run check:content && npm run typecheck && npm run lint`.
CI (`.github/workflows/ci.yml`) runs all of these plus `npm run build`.

## Folder structure

```
src/
  app/                         App Router: routes, layouts, metadata
    [locale]/[...slug]/page.tsx   doc + section-landing page (static)
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx
  components/                  UI — docs/ nav/ search/ footer/ ui/
  lib/
    config.ts                 SINGLE SOURCE OF TRUTH: locales, sections, site/org metadata, UI strings
    content.ts                filesystem MDX loader (gray-matter), nav tree, prev/next
    seo.tsx                   canonical/hreflang + JSON-LD builders
    generated/                build-generated (committed): markdown-routes.json
  middleware.ts               Accept: text/markdown content negotiation
content/<locale>/<section>/   the MDX documentation (the product)
scripts/                      build-time TS (run via tsx): search index, llms, markdown twins, validation, migration
public/                       static assets + generated artifacts
```

## Coding standards

- **TypeScript strict**; no `any` in `src/` (build scripts may use minimal casts).
- **Server Components by default**; add `"use client"` only where required
  (search dialog, locale switcher).
- **Tailwind** for styling; design tokens in `src/app/globals.css` /
  `tailwind.config.ts`.
- Import from `src/` via the **`@/*`** path alias.
- **Match the surrounding style** — files carry intent-revealing header comments;
  preserve that density and tone.

## Important constraints

- **Single source of truth.** `LOCALES` and `SECTIONS` are defined in
  `src/lib/config.ts`. Build scripts import them through `scripts/_content.ts` —
  never re-declare these lists.
- **Never hand-edit generated files.** Change the generator in `scripts/`
  instead. Generated: `public/search/*.json`, `public/llms.txt`,
  `public/llms-full.txt`, `public/<locale>/**/*.md`, `public/last-updated.json`,
  `src/lib/generated/*`, `next-env.d.ts`.
- **`postcss.config.js` must stay JavaScript** — Next.js's PostCSS loader does
  not accept a `.ts` config.
- **Static only.** Pages set `dynamicParams = false`; everything is prerendered.
  Don't introduce request-time-only behavior in `app/` pages.
- **MDX components** are injected via `src/components/docs/Mdx.tsx` (no per-file
  imports in content). Available: `Admonition`, `Figure`, `Chart`, `Audit`, and
  the named diagram components.
- **Frontmatter contract:** `title` (required), `description` (recommended),
  `position` (sidebar order), `sidebar_label` (optional). `check:content`
  fails the build on a missing `title` or a broken internal link.
- **Keep locales in parity.** A page added to `en` should be added to `es` and
  `fr` (otherwise `check:content` warns).

## Development workflow

1. Add or edit MDX under `content/<locale>/<section>/`.
2. `npm run dev` and verify the page, navigation, and search.
3. `npm run check:content` — catch broken links, missing frontmatter, parity gaps.
4. `npm run typecheck && npm run lint`.
5. Commit on a feature branch and open a PR; CI must pass before merge.
