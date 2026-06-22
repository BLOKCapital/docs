# BLOK Capital Docs — Engineering Documentation

Production documentation for this repository, derived **only** from what exists in
the codebase (no aspirational or invented content). This is a statically
generated (SSG) documentation **website** for the BLOK Capital protocol — built
with Next.js 15 (App Router), React 19, TypeScript (strict), and Tailwind CSS 3.

> It is a front-end content site. There is **no backend service, database, API
> layer, container, or cloud infrastructure** in this repository. See
> [What this repo is not](#what-this-repository-is-not) below.

## Documentation index

| Doc | What it covers |
|-----|----------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design: routing, the MDX content pipeline, SSG model, search architecture, component map, data flow. |
| [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md) | How to write docs: frontmatter, sections/locales, `_category.json`, MDX components, validation rules. |
| [BUILD_AND_SCRIPTS.md](BUILD_AND_SCRIPTS.md) | npm scripts, the five `tsx` build scripts, pre/post hooks, generated artifacts. |
| [SEO_AEO.md](SEO_AEO.md) | Metadata, robots/sitemap/manifest, JSON-LD structured data, OG image, `llms.txt`, i18n alternates. |
| [CONFIGURATION.md](CONFIGURATION.md) | `src/lib/config.ts` reference + how to add a locale or section. |
| [CI_CD_AND_OPERATIONS.md](CI_CD_AND_OPERATIONS.md) | The GitHub Actions pipeline, local commands, build/serve, deployment model. |
| [SECURITY.md](SECURITY.md) | Security posture, dependency surface, `npm audit` status, threat model for a static site. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev workflow, required checks, commit/PR conventions. |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Inventory of every runtime and dev dependency and why it's present. |
| [HARDENING.md](HARDENING.md) | **Appendix — Recommendations, not current state.** Gaps a security/DevOps review would flag. |

## TL;DR

```bash
npm install            # installs deps (Node >= 20)
npm run dev            # regenerates search index + llms.txt, then next dev
npm run build          # same prebuild hooks, then next build (full SSG)
npm run start          # serve the production build
npm run check:content  # validate frontmatter, internal links, locale parity
npm run lint           # eslint (next/core-web-vitals + next/typescript)
npm run typecheck      # tsc --noEmit
```

At a glance:

- **Content** — MDX under [content/](../content/): 3 locales (`en`, `es`, `fr`) ×
  4 sections (`concepts`, `smart-contracts`, `builders`, `resources`).
- **Rendering** — `next-mdx-remote` with GFM, KaTeX math, Shiki code highlighting,
  and Mermaid diagrams.
- **Routing** — `[locale]/[...slug]` dynamic routes, `dynamicParams = false`, fully
  prerendered via `generateStaticParams`.
- **Search** — a build-time FlexSearch index ([public/search/](../public/search/))
  queried client-side (⌘K). No external service.
- **SEO/AEO** — canonical + hreflang alternates, JSON-LD, OG images, `robots.txt`,
  `sitemap.xml`, and `llms.txt` / `llms-full.txt`.

## What this repository is **not**

These categories were checked and are **absent** — this documentation does not
describe them because they do not exist here:

- ❌ No Docker / `docker-compose` / container images
- ❌ No Kubernetes manifests
- ❌ No Terraform or other IaC
- ❌ No database, SQL, ORM, or schema (the site has no data layer)
- ❌ No automated tests (no Jest/Vitest/Playwright/Cypress)
- ❌ No environment variables / `.env` files (nothing reads `process.env` at runtime)
- ❌ No committed deploy config (`vercel.json`, `netlify.toml`, etc.)
- ❌ No backend services or API routes

Recommendations relating to several of these gaps live in
[HARDENING.md](HARDENING.md), clearly separated from this descriptive
documentation.
