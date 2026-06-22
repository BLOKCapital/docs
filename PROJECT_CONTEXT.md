# Project Context — BLOK Capital Docs

> A single-file, AI-friendly overview of what this repository is, how it is
> built, and how to work in it. Pairs with [AGENTS.md](AGENTS.md) (rules for
> coding assistants) and [README.md](README.md) (human onboarding).

## What this project does

This repository is the source for the **official BLOK Capital documentation
site** ([docs.blokcapital.io](https://docs.blokcapital.io)) — the canonical
reference for **BLOK Capital, a non-custodial, on-chain wealth-management
protocol on EVM chains**. It documents the Diamond (EIP-2535) architecture,
account abstraction, Gardens, facets, oracles, the V1 smart-contract system,
tokenomics, DAO governance, and builder guides, in **English, Spanish, and
French**.

It is a purpose-built **Next.js** application (intentionally *not* Docusaurus)
that compiles Markdown/MDX into a fast, statically-generated, search-engine- and
LLM-optimized documentation site.

## Value proposition

- **Fast & static** — every page is prerendered (SSG); no server round-trips,
  no client-side doc fetching.
- **Multilingual** — first-class `en`/`es`/`fr` routing with correct `hreflang`.
- **AI-native** — `llms.txt`, full-corpus `llms-full.txt`, per-page Markdown
  twins, and `Accept: text/markdown` content negotiation so agents read clean
  source instead of an HTML shell.
- **Discoverable** — rich JSON-LD structured data, canonical URLs, sitemap, and
  an AI-crawler-friendly `robots.txt`.
- **Maintainable** — filesystem-driven content and navigation; one source of
  truth for locales/sections; build-time content validation in CI.

## Main features

- MDX content in 3 locales × 4 sections (~139 pages), filesystem-driven nav,
  breadcrumbs, prev/next, and an "On this page" rail.
- Client-side search (FlexSearch) built from a build-time per-locale index — no
  external search service.
- Agent endpoints: `/llms.txt`, `/llms-full.txt`, and `<page>.md` twins.
- SEO/GEO: canonical + hreflang, Open Graph images, and JSON-LD for
  Organization, WebSite (+ SearchAction), TechArticle, BreadcrumbList,
  FAQPage, and CollectionPage.
- "Last updated" freshness dates derived from git history.

## Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | Next.js 15 (App Router), React 19 |
| Language   | TypeScript (strict mode) |
| Styling    | Tailwind CSS 3 |
| Content    | MDX (`next-mdx-remote`), `gray-matter` frontmatter |
| Rendering  | KaTeX (math), Shiki (syntax highlighting), Mermaid (diagrams) |
| Search     | FlexSearch (client) over a build-time index |
| Tooling    | `tsx` (TS build scripts), ESLint, Dependabot, GitHub Actions |
| Hosting    | Vercel |

## Architecture

**Build time** (`predev` / `prebuild` hooks → `next build`):
1. `scripts/build-search-index.ts`, `build-llms.ts`, and `build-markdown.ts`
   walk `content/`, parse frontmatter, and emit `public/` artifacts
   (`search/<locale>.json`, `llms.txt`, `llms-full.txt`, `<page>.md` twins) plus
   `src/lib/generated/markdown-routes.json` and `public/last-updated.json`.
2. `next build` statically generates every route from `generateStaticParams`
   (`src/lib/content.ts` → `getAllDocParams` + section roots), rendering MDX and
   injecting JSON-LD from `src/lib/seo.tsx`.

**Request time** (static hosting on Vercel):
- HTML is served from the CDN.
- `src/middleware.ts` rewrites a doc request carrying `Accept: text/markdown` to
  its prebuilt `.md` twin (browsers keep getting HTML).
- The client loads `/search/<locale>.json` on demand and builds the FlexSearch
  index in the browser.

## Key files & folders

| Path | Responsibility |
| ---- | -------------- |
| `src/lib/config.ts` | Single source of truth: locales, sections, site/org metadata, UI strings, keywords |
| `src/lib/content.ts` | MDX loader (fs + gray-matter), nav tree, prev/next, last-updated |
| `src/lib/seo.tsx` | Canonical/hreflang helpers + JSON-LD builders |
| `src/app/[locale]/[...slug]/page.tsx` | Doc + section-landing page (static) |
| `src/app/sitemap.ts` `robots.ts` `manifest.ts` | Crawl & PWA metadata |
| `src/components/docs/Mdx.tsx` | MDX component registry (Admonition, Figure, Chart, Audit, diagrams) |
| `src/middleware.ts` | `Accept: text/markdown` content negotiation |
| `content/<locale>/<section>/` | The MDX documentation (the product) |
| `scripts/` | Build-time generators + content validator + migration tool |

## Common workflows

- **Add a doc page** — create `content/<locale>/<section>/<slug>.mdx` with
  frontmatter (`title`, `description`, `position`), mirror it in the other
  locales, then `npm run check:content`.
- **Add a section/locale** — update `LOCALES`/`SECTIONS` in `src/lib/config.ts`
  (build scripts pick it up automatically) and add the content folders + UI
  strings.
- **Regenerate agent artifacts** — `npm run md` (twins), `npm run llms`
  (indexes), `npm run search:index` (search). All run automatically on
  `dev`/`build`.
- **Validate before pushing** — `npm run check:content && npm run typecheck && npm run lint`.

## Contribution guidelines

1. Branch from `main`; keep changes focused.
2. Author content in MDX with the frontmatter contract above; keep locales in
   parity.
3. Don't hand-edit generated files — change the generator in `scripts/`.
4. Run `check:content`, `typecheck`, and `lint` locally; CI gates every PR.
5. Match the existing code style and the intent-revealing comment density.

See [AGENTS.md](AGENTS.md) for the full constraint list and command reference.
