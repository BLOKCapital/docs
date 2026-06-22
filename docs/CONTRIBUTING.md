# Contributing

How to make changes to this repository. Conventions here are drawn from the
existing tooling, CI, and git history.

## Prerequisites

- **Node.js >= 20** ([package.json](../package.json) `engines`).
- npm (use `npm ci` for a clean, lockfile-exact install).

```bash
npm ci
npm run dev   # http://localhost:3000
```

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md#directory-layout). In short: docs content in
[content/](../content/), app code in [src/](../src/), build scripts in
[scripts/](../scripts/), this engineering documentation in [docs/](.).

## Making changes

### Content changes

Editing or adding documentation pages? Read
[CONTENT_AUTHORING.md](CONTENT_AUTHORING.md). The essentials:

- Put `.mdx` under `content/<locale>/<section>/…`.
- Always set a `title` (and ideally a `description`).
- Use absolute, locale-prefixed internal links.
- Add the page to **all three locales** to avoid parity warnings.
- Run `npm run check:content`.

### Code changes

- TypeScript is **strict**; keep `npm run typecheck` green.
- Match the surrounding style — the codebase favors small, focused components,
  server components by default (add `"use client"` only when needed), and the
  `cn()` helper ([utils.ts](../src/lib/utils.ts)) for class composition.
- If you touch `LOCALES` or `SECTIONS`, update **both**
  [config.ts](../src/lib/config.ts) **and** [scripts/_content.ts](../scripts/_content.ts)
  (CI fails on drift). See [CONFIGURATION.md](CONFIGURATION.md).

## Required checks (must pass before merge)

These mirror [the CI pipeline](CI_CD_AND_OPERATIONS.md). Run them locally before
pushing:

```bash
npm run check:content   # frontmatter, links, locale parity, config drift
npm run typecheck       # tsc --noEmit
npm run lint            # next lint
npm run build           # full SSG build (must succeed)
```

CI runs the same sequence on every push and pull request to `main`. A red CI run
blocks merge.

## Branching & pull requests

- The default and integration branch is **`main`**.
- Branch off `main`, push your branch, and open a PR into `main`.
- CI (`verify`) must be green.
- Keep PRs focused; update the relevant doc under [docs/](.) when behavior changes.

## Commit messages

The git history uses short, lower-case, prefixed summaries, e.g.:

```
feat: seo foundation, advanced search, themed diagrams across locales
fix: portal search modal, focus ring scope, footer copy
```

Recommended prefixes (matching existing history): `feat:`, `fix:`, `init:`.
Keep the subject imperative and concise; add a body when the change needs context.

## Generated files

`public/search/*.json` and `public/llms*.txt` are **generated** from content by
the `predev`/`prebuild` hooks. You normally don't hand-edit them. If a content
change should update them, run `npm run search:index` / `npm run llms` (or just
build) and commit the result. See
[BUILD_AND_SCRIPTS.md](BUILD_AND_SCRIPTS.md#generated-artifacts-committed).

## What not to do

- Don't render untrusted/third-party MDX without sandboxing (see
  [SECURITY.md](SECURITY.md#trust-boundary-mdx-content)).
- Don't add a `.ts` PostCSS config — Next's loader doesn't support it; the PostCSS
  config lives in the `postcss` key of [package.json](../package.json).
- Don't introduce `process.env` runtime config without documenting it; the site is
  currently env-free by design.
