# BLOK Capital Docs — Non-Custodial On-Chain Wealth Management Documentation

[![CI](https://github.com/BLOKCapital/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/BLOKCapital/docs/actions/workflows/ci.yml)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![llms.txt](https://img.shields.io/badge/llms.txt-✓-22c55e)](https://docs.blokcapital.io/llms.txt)
[![Live docs](https://img.shields.io/badge/docs-docs.blokcapital.io-3b82f6)](https://docs.blokcapital.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> The official documentation site for **BLOK Capital** — a **non-custodial,
> on-chain wealth-management protocol on EVM chains**. Built from scratch with
> **Next.js 15, React 19, TypeScript, and Tailwind**, optimized for search
> engines, answer engines, and AI agents.

**Live:** [docs.blokcapital.io](https://docs.blokcapital.io) ·
**For AI assistants:** [AGENTS.md](AGENTS.md) ·
[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) ·
[`/llms.txt`](https://docs.blokcapital.io/llms.txt)

This repository contains the **source** of the docs site, not the protocol
contracts. The documentation itself covers the **Diamond (EIP-2535)
architecture**, **account abstraction**, **Gardens**, **facets**, **oracles**,
the **V1 smart-contract system**, **tokenomics**, and **DAO governance**, in
English, Spanish, and French.

## Table of contents

- [Why this exists](#why-this-exists)
- [Who it's for](#who-its-for)
- [Features](#features)
- [Quickstart](#quickstart)
- [Project structure](#project-structure)
- [Authoring content](#authoring-content)
- [Agent-friendly docs](#agent-friendly-docs)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [SEO & discoverability](#seo--discoverability)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Why this exists

BLOK Capital lets users grow crypto wealth **without giving up custody** —
following professionally curated on-chain indices through smart-contract
"Gardens". Those concepts (a Diamond proxy, account abstraction, a decentralized
oracle network, DAO governance) need documentation that is **fast, multilingual,
and equally readable by humans, search engines, and AI agents**. This site
delivers that as a statically-generated Next.js app with built-in SEO, GEO
(generative-engine optimization), and an `llms.txt` + Markdown pipeline for LLMs.

## Who it's for

- **Protocol users** — understand non-custodial wealth management, Gardens, and indices.
- **Smart-contract & dApp builders** — reference the V1 architecture, facets, and integration guides.
- **Auditors & researchers** — read the EIP-2535 Diamond design, oracle flows, and tokenomics.
- **AI assistants & answer engines** — ingest the docs via `llms.txt` / per-page Markdown.

## Features

- **MDX content** under `content/<locale>/<section>/…`, rendered with
  `next-mdx-remote` (GFM, KaTeX math, Shiki syntax highlighting, Mermaid diagrams).
- **Three locales** — `en`, `es`, `fr` — routed as `/<locale>/…` with a language
  switcher and correct `<html lang>` / `hreflang`. `npm run check:content`
  reports locale parity gaps.
- **Four sections** — Concepts, Smart Contracts, Builders, Resources.
- **Local search** — a build-time index (`public/search/<locale>.json`) queried
  client-side with FlexSearch (⌘K / Ctrl-K). No external service.
- **Docs shell** — collapsible sidebar, scroll-spy "On this page" rail,
  breadcrumbs, and prev/next pagination, all derived from the filesystem.
- **Fully prerendered (SSG)** — every page is statically generated via
  `generateStaticParams` (`dynamicParams = false`).
- **Agent-friendly** — `llms.txt` / `llms-full.txt` plus a clean Markdown twin of
  every page (`<page>.md` + `Accept: text/markdown` content negotiation). See
  [Agent-friendly docs](#agent-friendly-docs).

## Quickstart

```bash
# Requirements: Node >= 20 (see .nvmrc)
git clone https://github.com/BLOKCapital/docs.git
cd docs
npm install
npm run dev          # http://localhost:3000  (regenerates search/llms/markdown first)
```

### Build & verify

```bash
npm run build         # generate artifacts, then next build
npm run start         # serve the production build
npm run check:content # validate frontmatter, internal links & locale parity
npm run lint          # eslint (next/core-web-vitals + next/typescript)
npm run typecheck     # tsc --noEmit
```

## Project structure

```
content/                 the MDX documentation (the product)
  en/  es/  fr/
    concepts/            ← protocol fundamentals
    smart-contracts/     ← V1 on-chain architecture
    builders/            ← builder guides
    resources/           ← tokenomics, audits, FAQs, brand, addresses
src/
  app/                   App Router routes, layouts, sitemap/robots/manifest, OG image
  components/            UI — docs/ nav/ search/ footer/ ui/
  lib/                   config (single source of truth), content loader, SEO helpers
  middleware.ts          Accept: text/markdown content negotiation
scripts/                 build-time TS scripts (run via tsx)
public/                  static assets + generated artifacts
```

## Authoring content

- **Frontmatter:** `title` (required), `description` (recommended), `position`
  (sidebar order), `sidebar_label` (optional).
- **Folder ordering/labels** come from `_category.json` (`{ "label", "position" }`).
- **Admonitions:** `<Admonition kind="note|tip|info|warning|danger">…</Admonition>`.
- **Dynamic blocks** `<Chart />` (tokenomics) and `<Audit />` (audit reports) are
  React components registered in `src/components/docs/Mdx.tsx`.
- Keep pages **in parity across locales** (add to `en`, `es`, and `fr`).

## Agent-friendly docs

Optimized for AI agents and answer engines per the
[AFDocs / Agent Score](https://buildwithfern.com/agent-score) spec. Built at
`predev` / `prebuild` time:

- **`/llms.txt`** — curated index: site summary + every doc as a Markdown link
  (pointing at the `.md` twin) with a one-line description.
- **`/llms-full.txt`** — the entire English corpus as Markdown in one file.
- **Markdown twins** — every page has a raw-Markdown version
  (`scripts/build-markdown.ts`):
  - **`.md` URL** — append `.md` to any doc path, e.g.
    `https://docs.blokcapital.io/en/concepts/diamond.md`.
  - **Content negotiation** — request the canonical URL with
    `Accept: text/markdown` and `src/middleware.ts` serves the twin; browsers
    still get HTML.
- **Freshness** — each doc shows a "Last updated" date (from git history),
  surfaced on the page and stamped into every `.md`.

Generated `.md` twins (`public/<locale>/…`) and `public/last-updated.json` are
build output (gitignored); `src/lib/generated/markdown-routes.json` is committed
so `tsc` and the edge middleware resolve it without a prior build.

## Architecture

| Concern | Where |
| ------- | ----- |
| Design tokens | `src/app/globals.css`, `tailwind.config.ts` |
| Config/locales (single source of truth) | `src/lib/config.ts` |
| Content loader | `src/lib/content.ts` (fs + gray-matter) |
| MDX renderer | `src/components/docs/Mdx.tsx` |
| SEO / JSON-LD | `src/lib/seo.tsx` |
| Search | `scripts/build-search-index.ts` + `src/components/search/*` |
| Routing | `src/app/[locale]/[...slug]/page.tsx` |
| Agent endpoints | `scripts/build-llms.ts`, `scripts/build-markdown.ts`, `src/middleware.ts` |
| Shared script helpers | `scripts/_content.ts` (walk/parse, imports locale + section lists) |
| Validation | `scripts/check-content.ts` (run in CI) |

For a deeper, AI-readable overview see [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
In-depth engineering docs — [architecture](docs/ARCHITECTURE.md),
[build & scripts](docs/BUILD_AND_SCRIPTS.md), [CI/CD & operations](docs/CI_CD_AND_OPERATIONS.md),
[configuration](docs/CONFIGURATION.md), [content authoring](docs/CONTENT_AUTHORING.md),
[dependencies](docs/DEPENDENCIES.md), [hardening](docs/HARDENING.md), and
[SEO/AEO](docs/SEO_AEO.md) — live in [`docs/`](docs/README.md).

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server (regenerates artifacts first) |
| `npm run build` | Generate artifacts, then `next build` |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` (app + scripts) |
| `npm run lint` | ESLint |
| `npm run check:content` | Validate frontmatter, links, locale parity |
| `npm run search:index` | Rebuild the search index |
| `npm run llms` | Rebuild `llms.txt` + `llms-full.txt` |
| `npm run md` | Rebuild per-page Markdown twins |

### Re-migrating from Docusaurus

The original Markdown was imported with:

```bash
npx tsx scripts/migrate-content.ts "<path to old documentation repo>"
```

It normalizes frontmatter, converts admonitions and HTML comments, rewrites
internal links, and copies `static/img` → `public/img`.

## SEO & discoverability

Built in, no plugins:

- **Canonical URLs + `hreflang`** for all three locales, with `x-default`.
- **JSON-LD structured data** — Organization, WebSite (+ SearchAction),
  TechArticle, BreadcrumbList, FAQPage, CollectionPage (`src/lib/seo.tsx`).
- **Open Graph / Twitter** cards with a generated OG image.
- **`sitemap.xml`**, **`robots.txt`** (explicitly welcoming GPTBot, ClaudeBot,
  PerplexityBot, Google-Extended, etc.), and a **PWA manifest**.
- **Security headers** (HSTS, `nosniff`, frame-deny, Referrer-Policy,
  Permissions-Policy) via `next.config.ts`.

## FAQ

**How do I add a new documentation page?**
Create `content/<locale>/<section>/<slug>.mdx` with `title`/`description`/`position`
frontmatter, add the same page to the other locales, then run
`npm run check:content`.

**How do I add a new language or section?**
Update `LOCALES` / `SECTIONS` in `src/lib/config.ts` — the build scripts import
those lists, so there's nothing to keep in sync — then add the content folders
and UI strings.

**How do agents get clean Markdown instead of HTML?**
Append `.md` to any doc URL, or send `Accept: text/markdown` to the canonical
URL. See [Agent-friendly docs](#agent-friendly-docs).

**Why are there both `llms.txt` and `llms-full.txt`?**
`llms.txt` is a compact, link-based index for agents to navigate;
`llms-full.txt` is the entire corpus inlined for single-fetch ingestion.

**Why does search need no external service?**
A per-locale index is generated at build into `public/search/`, and FlexSearch
runs entirely in the browser.

**Can `postcss.config.js` be TypeScript?**
No — Next.js's PostCSS loader only accepts `.js`/`.mjs`/`.cjs`/`.json`. Every
other config and script in the repo is TypeScript.

**How are "Last updated" dates computed?**
From git commit history at build time (`scripts/build-markdown.ts`), with a
filesystem-mtime fallback.

## Contributing

Contributions are welcome. Branch from `main`, keep changes focused, author
content with the frontmatter contract above, and keep locales in parity. Run
`npm run check:content && npm run typecheck && npm run lint` before opening a PR;
CI must pass before merge. AI coding assistants: read [AGENTS.md](AGENTS.md)
first.

## License

[MIT](LICENSE) © BLOK Capital DAO LLC.
