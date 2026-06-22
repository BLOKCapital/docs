# Content Authoring

How to add and edit documentation pages. All rules below are enforced by code in
this repository (the content loader and the validator), not by convention alone.

## Where content lives

```
content/
  en/  es/  fr/                ← one folder per locale (LOCALES in config.ts)
    concepts/                  ← protocol fundamentals
    smart-contracts/           ← V1 on-chain architecture
    builders/                  ← builder guides
    resources/                 ← tokenomics, audits, FAQs, brand, addresses
```

The locale folders and the four section folders are fixed by
[src/lib/config.ts](../src/lib/config.ts) (`LOCALES`, `SECTIONS`). To add a new
locale or section, see [CONFIGURATION.md](CONFIGURATION.md) — it is a code change,
not just a content change.

A page's URL is derived from its path:
`content/en/concepts/diamond.mdx` → `/en/concepts/diamond`.

## File and folder conventions

| Convention | Effect | Defined in |
|-----------|--------|-----------|
| `*.mdx` / `*.md` | A page. | [content.ts](../src/lib/content.ts) `isContentFile` |
| `index.mdx` | The **landing page for its parent folder** (segments collapse to the folder). | `content.ts` `walkSection` / `buildTree` |
| `_category.json` | Folder label + sort position. | `content.ts` `readCategoryMeta` |
| `_category_.json` | Legacy alias for `_category.json` (still read). | `content.ts` |
| files/folders starting with `.` | Ignored. | `content.ts` |

`_category.json` shape:

```json
{
  "label": "V1 Documentation",
  "position": 1
}
```

- `label` — shown in the sidebar and breadcrumbs (falls back to a title-cased
  folder name).
- `position` — sort order within the parent (ascending; missing → `999`).

## Frontmatter

Frontmatter is YAML at the top of each file, parsed by `gray-matter`. The
recognized keys (from `DocFrontmatter` in [content.ts](../src/lib/content.ts)):

| Key | Type | Required | Purpose |
|-----|------|:--------:|---------|
| `title` | string | **yes*** | Page `<h1>`, `<title>`, breadcrumb, nav label. |
| `description` | string | recommended | Meta description + nav/SEO snippet. |
| `position` | number | optional | Sidebar sort order within the folder. |
| `sidebar_label` | string | optional | Overrides `title` in the sidebar only. |
| `slug` | string | optional | Present in the type; routing is path-derived. |

\* `title` is technically derived from the filename if omitted, **but the content
validator treats a missing `title` as a build-failing error** (see
[Validation](#validation)). Always set it.

Example:

```mdx
---
title: The Diamond Standard
description: How BLOK Capital uses EIP-2535 Diamonds for upgradeable, modular accounts.
position: 2
---

Body content starts here. Do **not** repeat the title as an `# H1` — the page
template renders the title from frontmatter.
```

## MDX components available to authors

These are registered in the components map in
[Mdx.tsx](../src/components/docs/Mdx.tsx) and can be used directly as JSX in any
`.mdx` file.

### `<Admonition>`

Callout box. ([Admonition.tsx](../src/components/docs/Admonition.tsx))

```mdx
<Admonition kind="warning" title="Audit in progress">

Body markdown here.

</Admonition>
```

- `kind`: `"note"` (default) `| "tip" | "info" | "warning" | "danger"`.
- `title`: optional; defaults to a per-kind label.

> Migrated Docusaurus `:::note … :::` blocks were converted to `<Admonition>` by
> [migrate-content.ts](../scripts/migrate-content.ts). New content should use the
> component directly.

### `<Mermaid>`

Renders a Mermaid diagram client-side. ([Mermaid.tsx](../src/components/docs/Mermaid.tsx))

```mdx
<Mermaid caption="Account abstraction flow" chart={`
flowchart LR
  A[User] --> B[Smart Account]
  B --> C[Bundler]
`} />
```

- `chart`: the Mermaid source (string).
- `caption`: optional figure caption.
- Initialized with `theme: "base"` and `securityLevel: "strict"`. On a render
  error it falls back to showing the raw chart source in a `<pre>`.

### Pre-built diagrams

[diagrams.tsx](../src/components/docs/diagrams.tsx) exports 14 ready-made,
themed diagram components (no props):

`UserJourneyDiagram`, `AccountAbstractionDiagram`, `ProxyContractDiagram`,
`OracleNetworkDiagram`, `WealthManagementDiagram`, `IndexGardenDiagram`,
`ProtocolV1Diagram`, `DaoProposalDiagram`, `ProxyFlowDiagram`,
`DelegationDiagram`, `DiamondComponentsDiagram`, `GardenIndexDiagram`,
`DiamondDiagram`, `SystemOverviewDiagram`.

```mdx
<SystemOverviewDiagram />
```

These replaced the former raster (`/img/*.png`) diagrams.

### `<Figure>`

Frames arbitrary content with an optional caption.
([Figure.tsx](../src/components/docs/Figure.tsx))

```mdx
<Figure caption="Protocol overview" narrow>
  ...content...
</Figure>
```

- `caption`: optional `<figcaption>`.
- `narrow`: constrain to a centered, narrower column.

### `<Audit>` and `<Chart>`

Data-driven blocks that read from [src/lib/data/](../src/lib/data/):

- `<Audit />` → `AuditReports`, renders from
  [auditData.json](../src/lib/data/auditData.json).
- `<Chart />` → `TokenomicsChart`, renders the donut chart from
  [tokenData.json](../src/lib/data/tokenData.json).

Neither takes props; to change what they show, edit the JSON data files.

### Markdown features

Provided by the remark/rehype pipeline (see
[ARCHITECTURE.md](ARCHITECTURE.md#mdx-rendering)):

- **GFM** — tables, task lists, strikethrough, autolinks (`remark-gfm`).
- **Math** — inline `$…$` and block `$$…$$` (`remark-math` + `rehype-katex`).
- **Code** — fenced blocks highlighted by Shiki (`github-dark`); set a language
  on the fence (defaults to `text`).
- **Headings** — auto-assigned ids + an appended `#` anchor link.

### Images

Use standard Markdown/JSX image syntax. Images render as native lazy
`<img loading="lazy">` (see `MdxImage` in
[Mdx.tsx](../src/components/docs/Mdx.tsx)), so any aspect ratio is fine. Place
assets under [public/](../public/) (e.g. `/img/...`, `/brand/...`).

## Links

Internal links route through `next/link`; external (`http(s)://` or `//`) open in
a new tab with `rel="noopener noreferrer"`.

**Always use absolute, locale-prefixed paths** for internal links:

```mdx
See [the Diamond standard](/en/concepts/diamond).
```

The validator flags links missing a locale prefix and relative links as warnings,
and **broken internal links as errors** (see below).

Valid non-doc targets are the public asset prefixes `/img`, `/brand`,
`/textures`, `/search`, `/favicon` (from
[check-content.ts](../scripts/check-content.ts)).

## Translations & locale parity

Every page should exist in all three locales with the same relative path
(`content/<locale>/<section>/<same-path>`). The validator emits a **parity
warning** for any page present in some locales but not others. Parity gaps do not
fail the build, but they degrade hreflang/SEO and the locale switcher experience.

The `LocaleSwitcher` preserves the current path when switching languages — if the
target translation is missing, the user lands on a 404.

## Validation

Run before committing:

```bash
npm run check:content
```

[check-content.ts](../scripts/check-content.ts) reports:

**Errors (exit 1 — fail the build):**

- A doc missing a `title` frontmatter.
- A broken internal link `/{locale}/…` that resolves to no page or ancestor.
- `LOCALES`/`SECTIONS` drift between the scripts and `src/lib/config.ts`.

**Warnings (non-fatal):**

- A link missing a locale prefix, or a relative link.
- Locale parity gaps.
- Duplicate `position` within a folder.
- Missing `description`.

This script also runs in CI (see [CI_CD_AND_OPERATIONS.md](CI_CD_AND_OPERATIONS.md)).

## After editing content

The search index and `llms.txt` are generated from content and are committed
artifacts under [public/](../public/). They regenerate automatically on
`npm run dev` / `npm run build` (via the `predev`/`prebuild` hooks), or manually:

```bash
npm run search:index   # rebuild public/search/<locale>.json
npm run llms           # rebuild public/llms.txt + llms-full.txt
```

See [BUILD_AND_SCRIPTS.md](BUILD_AND_SCRIPTS.md) for details.
