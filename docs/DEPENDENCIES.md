# Dependencies

Every dependency declared in [package.json](../package.json) and why it is here.
Versions are the declared semver ranges; the installed lockfile
([package-lock.json](../package-lock.json)) pins exact versions.

## Runtime dependencies

### Framework & UI

| Package | Range | Role |
|---------|-------|------|
| `next` | ^15.1.0 | The framework — App Router, SSG, metadata routes, `next/og`, `next/font`, `next/image`, `next/link`. |
| `react` | ^19.0.0 | UI runtime (Server + Client Components). Also `cache()` for the content loader. |
| `react-dom` | ^19.0.0 | DOM renderer; `createPortal` for the search dialog. |

### MDX rendering pipeline

| Package | Range | Role |
|---------|-------|------|
| `next-mdx-remote` | ^5.0.0 | Renders MDX bodies via `/rsc` ([Mdx.tsx](../src/components/docs/Mdx.tsx)). |
| `gray-matter` | ^4.0.3 | Parses YAML frontmatter from `.mdx` (content loader + build scripts). |
| `remark-gfm` | ^4.0.0 | GitHub-Flavored Markdown (tables, task lists, autolinks). |
| `remark-math` | ^6.0.0 | Parses `$…$` / `$$…$$` math syntax. |
| `rehype-katex` | ^7.0.1 | Renders parsed math to HTML. |
| `katex` | ^0.16.11 | Math typesetting engine + CSS (imported in [layout.tsx](../src/app/layout.tsx)). |
| `rehype-slug` | ^6.0.0 | Assigns ids to headings (anchor targets). |
| `rehype-autolink-headings` | ^7.1.0 | Appends `#` anchor links to headings. |
| `rehype-pretty-code` | ^0.14.0 | Code-block highlighting (wraps Shiki). |
| `shiki` | ^1.24.0 | The syntax highlighter used by `rehype-pretty-code` (theme `github-dark`). |

### Content features

| Package | Range | Role |
|---------|-------|------|
| `mermaid` | ^11.15.0 | Diagram rendering. **Dynamically imported** in [Mermaid.tsx](../src/components/docs/Mermaid.tsx) so it loads only on diagram pages. |
| `flexsearch` | ^0.7.43 | Client-side full-text search index ([SearchDialog.tsx](../src/components/search/SearchDialog.tsx)). Listed in `optimizePackageImports` in [next.config.ts](../next.config.ts). |
| `github-slugger` | ^2.0.0 | Generates heading slugs identically to `rehype-slug`, so the TOC ([toc.ts](../src/lib/toc.ts)) and search headings ([scripts/_content.ts](../scripts/_content.ts)) match rendered anchor ids. |

### Styling utilities

| Package | Range | Role |
|---------|-------|------|
| `clsx` | ^2.1.1 | Conditional className construction. |
| `tailwind-merge` | ^2.5.4 | De-duplicates conflicting Tailwind classes. Combined with `clsx` in `cn()` ([utils.ts](../src/lib/utils.ts)). |

## Dev dependencies

| Package | Range | Role |
|---------|-------|------|
| `typescript` | ^5.6.3 | Type system; `tsc --noEmit` typecheck. |
| `tsx` | ^4.19.2 | Executes the TypeScript build scripts on Node 20+ without a compile step ([scripts/](../scripts/)). |
| `tailwindcss` | ^3.4.13 | Utility CSS framework ([tailwind.config.ts](../tailwind.config.ts)). |
| `postcss` | ^8.4.47 | CSS processing pipeline (configured via the `postcss` key in `package.json`). |
| `autoprefixer` | ^10.4.20 | Adds vendor prefixes during PostCSS processing. |
| `eslint` | ^9.17.0 | Linter. |
| `eslint-config-next` | ^15.1.0 | Next.js ESLint rules (`next/core-web-vitals` + `next/typescript`). |
| `@types/node` | ^22.7.5 | Node type definitions (scripts, fs/path). |
| `@types/react` | ^19.0.0 | React type definitions. |
| `@types/react-dom` | ^19.0.0 | React DOM type definitions. |

## Notable characteristics

- **No runtime data/network libraries** — no HTTP client, no database driver, no
  state-management library. The site fetches only its own static search JSON, with
  the browser's `fetch`.
- **`mermaid` is the heaviest dependency** and is deliberately code-split via
  dynamic `import()` so it doesn't inflate non-diagram pages.
- **`flexsearch` runs entirely client-side**; there is no search backend.
- Dependency **vulnerabilities** are tracked in
  [SECURITY.md](SECURITY.md#dependency-security-npm-audit). Re-check with
  `npm audit` before releases.

## Updating dependencies

```bash
npm outdated          # see what's behind
npm update            # within declared ranges
npm audit             # check advisories
# then always:
npm run typecheck && npm run lint && npm run build
```

There is no automated dependency-update bot configured (see
[HARDENING.md](HARDENING.md)).
