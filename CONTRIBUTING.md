# Contributing to BLOK Capital Docs

Thanks for helping improve the [BLOK Capital documentation](https://docs.blokcapital.io)!
This guide is for humans. **AI coding assistants should read [AGENTS.md](AGENTS.md)**
for the full constraint list; deeper architecture is in
[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Getting set up

```bash
# Node >= 20 (see .nvmrc)
npm install
npm run dev          # http://localhost:3000
```

## Ways to contribute

- **Fix or improve content** — edit the MDX under `content/<locale>/<section>/`.
- **Translate** — add the missing locale version of a page (keep `en`/`es`/`fr`
  in parity).
- **Improve the site** — components, styling, SEO, tooling under `src/` and
  `scripts/`.

## Authoring content

Create `content/<locale>/<section>/<slug>.mdx` with frontmatter:

```yaml
---
title: Your Page Title          # required
description: One-sentence summary used for SEO + AI snippets   # recommended
position: 3                      # sidebar order within the folder
sidebar_label: Short Label       # optional, defaults to title
---
```

- Use the registered MDX components instead of raw HTML where possible:
  `<Admonition kind="note|tip|info|warning|danger">…</Admonition>`, `<Figure>`,
  `<Chart>`, `<Audit>`, and the named diagram components (see
  `src/components/docs/Mdx.tsx`).
- Prefer absolute internal links (`/<locale>/<section>/…`); `check:content`
  validates them.
- **Add new pages to all three locales** (or expect a parity warning).
- **Do not hand-edit generated files** (`public/search/*.json`, `public/llms*.txt`,
  `public/<locale>/**/*.md`, `src/lib/generated/*`) — change the generator in
  `scripts/`.

## Before you open a PR

Run the same checks CI runs:

```bash
npm run check:content   # frontmatter, internal links, locale parity
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
```

## Pull request process

1. Branch from `main` and keep changes focused.
2. Use a clear, descriptive PR title and explain the "why".
3. Ensure CI is green (`.github/workflows/ci.yml` runs content validation,
   typecheck, lint, and build).
4. A maintainer will review and merge.

## Reporting issues

- **Bugs / content errors / feature requests** — open a GitHub issue.
- **Security vulnerabilities** — follow [SECURITY.md](SECURITY.md); do **not**
  open a public issue.
