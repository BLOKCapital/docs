# SEO & AEO (Answer-Engine Optimization)

This site invests heavily in being correctly understood by both classic search
engines and generative answer engines (ChatGPT, Claude, Perplexity, Gemini,
Copilot). Everything below is implemented in code.

Primary sources:
[src/lib/seo.tsx](../src/lib/seo.tsx),
[src/app/layout.tsx](../src/app/layout.tsx),
[src/app/robots.ts](../src/app/robots.ts),
[src/app/sitemap.ts](../src/app/sitemap.ts),
[src/app/manifest.ts](../src/app/manifest.ts),
[src/app/opengraph-image.tsx](../src/app/opengraph-image.tsx),
[scripts/build-llms.ts](../scripts/build-llms.ts).

## Metadata

### Root defaults — [layout.tsx](../src/app/layout.tsx)

The root `metadata` export sets site-wide defaults:

- `metadataBase: new URL(SITE.url)` — makes all relative URLs absolute.
- `title.template: "%s · BLOK Capital Docs"` with a default home title.
- `description`, `applicationName`, `keywords` (`SITE_KEYWORDS`), `authors`,
  `creator`, `publisher`, `category: "technology"`.
- `robots` — index/follow on, with `googleBot` `max-image-preview: large`,
  `max-snippet: -1`, `max-video-preview: -1`.
- `openGraph` (type `website`) and `twitter` (`summary_large_image`,
  `TWITTER_HANDLE`), both wired to the generated OG image.
- `verification` — commented placeholders for Google/Bing site-verification
  tokens (drop real tokens in when verifying ownership).

`viewport` sets `themeColor: "#FAF7F0"` and `colorScheme: "light"`.

### Per-page metadata — [[locale]/[...slug]/page.tsx](../src/app/[locale]/[...slug]/page.tsx)

`generateMetadata` produces page-specific tags:

- **Doc pages** — `title` from frontmatter; `description` from frontmatter, or a
  generated `excerpt(body)` (~155 chars) when omitted, so **every page ships a
  real meta description**. Adds `keywords`, canonical + hreflang `alternates`,
  `openGraph` (type `article`), and `twitter`.
- **Section landings** — title/description from `UI` / `SECTION_BLURB`
  ([config.ts](../src/lib/config.ts)), `openGraph` type `website`.
- **Locale home** ([[locale]/page.tsx](../src/app/[locale]/page.tsx)) — absolute
  title (not wrapped by the template), canonical + hreflang.

## Canonicals & hreflang (i18n)

Implemented in [seo.tsx](../src/lib/seo.tsx):

- `canonicalFor(locale, path)` — the canonical absolute URL for a page.
- `languageAlternates(path)` — a map of `{ en, es, fr, x-default }` absolute URLs;
  `x-default` points at the primary locale (`LOCALES[0]` = `en`).
- `alternatesFor(locale, path)` — `{ canonical, languages }` ready to spread into
  a Next `Metadata.alternates`.
- `ogLocale(locale)` — the OG locale code plus `alternateLocale` for the other
  languages (`OG_LOCALE` map in config).

Every doc page, section landing, and locale home emits canonical + full hreflang
alternates. The same alternates are attached to each `sitemap.xml` entry.

## robots.txt — [robots.ts](../src/app/robots.ts)

Generated as a Next metadata route, served at `/robots.txt`.

- Allows all crawlers (`User-agent: *`, `Allow: /`), disallowing only internal
  routes (`/api/`, `/_next/`).
- **Explicitly allow-lists named AI/answer-engine crawlers** (full access, no
  crawl-delay): `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`,
  `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`,
  `Google-Extended`, `GoogleOther`, `Applebot-Extended`, `Amazonbot`, `Bingbot`,
  `CCBot`, `cohere-ai`, `Bytespider`.
- References the sitemap and canonical `host`.

> This is an intentional posture: the docs are public and the project *wants*
> them surfaced and cited in generative answers.

## sitemap.xml — [sitemap.ts](../src/app/sitemap.ts)

Generated at `/sitemap.xml`. Covers every indexable URL across all locales:

| URL type | priority | changeFrequency |
|----------|:--------:|-----------------|
| Locale homes (`/<locale>`) | 1.0 | weekly |
| Section landings (`/<locale>/<section>`) | 0.8 | weekly |
| Docs (`/<locale>/<segments>`) | 0.7 | monthly |

Each entry carries `alternates.languages` (hreflang) so engines treat the
per-locale pages as one cluster. The default locale's doc tree drives the
canonical set (all locales mirror the same routes).

## Structured data (JSON-LD)

[seo.tsx](../src/lib/seo.tsx) provides typed builders, rendered via the `<JsonLd>`
helper (which inlines `<script type="application/ld+json">` and escapes `<` to
`<`).

| Builder | Schema type | Emitted where |
|---------|-------------|---------------|
| `organizationLd()` | `Organization` (with `sameAs`, `legalName`, logo) | Site-wide, in [[locale]/layout.tsx](../src/app/[locale]/layout.tsx) |
| `websiteLd(locale)` | `WebSite` + `SearchAction` (sitelinks search box) | Site-wide, in the locale layout |
| `breadcrumbLd(items)` | `BreadcrumbList` | Every doc/landing page |
| `articleLd(opts)` | `TechArticle` | Doc pages |
| `faqLd(qa)` | `FAQPage` | Doc pages whose slug matches `/faq/i` |
| `collectionPageLd(opts)` | `CollectionPage` | Section landings + locale home |

Page-level selection logic ([[...slug]/page.tsx](../src/app/[locale]/[...slug]/page.tsx)):

- Always emit a `BreadcrumbList`.
- Doc page → `FAQPage` when the slug looks like a FAQ (and `extractFaq` finds Q&A
  pairs), otherwise `TechArticle`.
- Section landing → `CollectionPage`.

The `SearchAction` `urlTemplate` is `"<localeHome>?q={search_term_string}"`,
matching the `?q=` param the client search reads.

## Content → snippet helpers

In [seo.tsx](../src/lib/seo.tsx), reused so machine-readable summaries match what
users see:

- `toPlainText(body)` — strips MDX/markdown to prose (mirrors the search indexer).
- `excerpt(body, max=155)` — a clean meta-description fallback from the first
  prose paragraph, skipping leading numbering and ultra-short fragments.
- `extractFaq(body)` — parses `##`/`###` headings into question/answer pairs for
  `FAQPage` schema.

## Open Graph image — [opengraph-image.tsx](../src/app/opengraph-image.tsx)

A 1200×630 PNG generated at build time with `next/og` `ImageResponse`, using the
Garden Journal palette. It is the default OG/Twitter card; pages re-attach it via
`OG_IMAGE` (because Next replaces, rather than deep-merges, the `openGraph` field
when a page overrides it).

## Web App Manifest — [manifest.ts](../src/app/manifest.ts)

Served at `/manifest.webmanifest`. `display: standalone`, `start_url: /en`,
theme/background `#FAF7F0`, categories `["education","finance","developer",
"documentation"]`, icons from `/favicon.ico` and `/brand/blokc-black.svg`.

## llms.txt — [build-llms.ts](../scripts/build-llms.ts)

The AEO centerpiece. Two static files served at the site root:

- `/llms.txt` — a compact, curated map (summary + per-section link index).
- `/llms-full.txt` — the entire English corpus as Markdown, for single-fetch
  ingestion by agents.

See [BUILD_AND_SCRIPTS.md](BUILD_AND_SCRIPTS.md#build-llmsts--aianswer-engine-corpus).

## Operational notes

- **Set the verification tokens** in [layout.tsx](../src/app/layout.tsx)
  (`metadata.verification`) when registering with Google Search Console / Bing
  Webmaster Tools.
- The canonical origin is `SITE.url` (`https://docs.blokcapital.io`) in
  [config.ts](../src/lib/config.ts) — update it there if the domain changes; every
  canonical/sitemap/JSON-LD URL derives from it.
