# BLOK Capital Docs

Documentation site for the BLOK Capital protocol, built from scratch with
**Next.js 15 (App Router) + React 19 + Tailwind**, sharing the *Garden Journal*
design language with the marketing site (`new-webiste`). No Docusaurus.

## Features

- **MDX content** under `content/<locale>/<section>/…`, rendered with
  `next-mdx-remote` (GFM, math via KaTeX, syntax highlighting via Shiki).
- **Three locales** — `en`, `es`, `fr` — routed as `/<locale>/…` with a
  language switcher. Full content parity migrated from the old Docusaurus repo.
- **Four sections** — Concepts, Smart Contracts, Builders, Resources.
- **Local search** — a build-time index (`public/search/<locale>.json`) queried
  client-side with FlexSearch (⌘K / Ctrl-K). No external service.
- **Docs shell** — collapsible sidebar, scroll-spy "On this page" rail,
  breadcrumbs, and prev/next pagination, all derived from the filesystem.
- **Static export** — every page is prerendered (`generateStaticParams`).

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000  (regenerates search index first)
```

## Build

```bash
npm run build        # runs the search-index generator, then next build
npm run start        # serve the production build
```

## Content

```
content/
  en/  es/  fr/
    concepts/          ← protocol fundamentals
    smart-contracts/   ← V1 on-chain architecture
    builders/          ← builder guides
    resources/         ← tokenomics, audits, FAQs, brand, addresses
```

- Frontmatter: `title`, `description`, `position` (sidebar order),
  `sidebar_label` (optional).
- Folder ordering/labels come from `_category.json` (`{ "label", "position" }`).
- Admonitions use `<Admonition kind="note|tip|info|warning|danger">…</Admonition>`.
- Dynamic blocks `<Chart />` (tokenomics) and `<Audit />` (audit reports) are
  React components registered in `src/components/docs/Mdx.tsx`.

## Re-migrating from Docusaurus

The original Markdown was imported with:

```bash
node scripts/migrate-content.mjs "<path to old documentation repo>"
```

It normalizes frontmatter, converts admonitions and HTML comments, rewrites
internal links, and copies `static/img` → `public/img`.

## Architecture

| Concern        | Where                                            |
| -------------- | ------------------------------------------------ |
| Design tokens  | `src/app/globals.css`, `tailwind.config.ts`      |
| Config/locales | `src/lib/config.ts`                              |
| Content loader | `src/lib/content.ts` (fs + gray-matter)          |
| MDX renderer   | `src/components/docs/Mdx.tsx`                     |
| Search         | `scripts/build-search-index.mjs` + `src/components/search/*` |
| Routing        | `src/app/[locale]/[...slug]/page.tsx`            |
# docs
