# Security

Security posture of this repository, described factually. This is a **static
documentation website** — the attack surface is small and well understood. For
recommended improvements (which go beyond current state), see
[HARDENING.md](HARDENING.md).

## Threat model in one paragraph

The application renders **first-party, build-time** MDX content into static HTML.
There is no backend, no database, no authentication, no user accounts, no
user-supplied input persisted anywhere, and no secrets. The only runtime input is
the search query, which is processed **entirely in the browser** against a
prebuilt static JSON index — it never reaches a server. Consequently the classic
web risks (SQLi, auth bypass, SSRF, secret leakage, injection into a data store)
do not apply because the corresponding components do not exist.

## What protects the site today

These are implemented in the code:

| Control | Where | Effect |
|---------|-------|--------|
| External links hardened | `MdxLink` in [Mdx.tsx](../src/components/docs/Mdx.tsx), `Button` in [Button.tsx](../src/components/ui/Button.tsx), `FooterLink` in [Footer.tsx](../src/components/footer/Footer.tsx) | All external links use `target="_blank"` **with `rel="noopener noreferrer"`**, preventing reverse-tabnabbing and referrer leakage. |
| JSON-LD output escaping | `JsonLd` in [seo.tsx](../src/lib/seo.tsx) | Serialized JSON-LD escapes `<` → `<` so a `</script>` sequence in content can't break out of the tag. |
| Mermaid strict mode | [Mermaid.tsx](../src/components/docs/Mermaid.tsx) | `securityLevel: "strict"` disables script execution / HTML injection in diagram definitions. |
| Internal-route disallow | [robots.ts](../src/app/robots.ts) | `/api/` and `/_next/` are disallowed for crawlers (index hygiene). |
| No secrets in tree | repo-wide | No `.env`, no API keys, no credentials; nothing to leak. |
| Strict TypeScript | [tsconfig.json](../tsconfig.json) | `strict: true` catches a class of nullability/type bugs at build time. |

## Trust boundary: MDX content

The single most important security fact about this codebase:

> **MDX is treated as trusted, first-party source.** It lives in
> [content/](../content/), is authored by maintainers, is reviewed via pull
> request, and is compiled at **build time** — not fetched from users at runtime.

This matters because MDX can embed JSX/expressions. Rendering **untrusted** MDX
would be a remote-code-execution vector (see the `next-mdx-remote` advisory
below). In this project the content is part of the repo and changes only through
the normal review/CI flow, so that vector is not exposed in practice. **Do not**
introduce a feature that renders user-submitted or third-party MDX without
sandboxing.

## Dependency security (`npm audit`)

As of the last run, `npm audit` reports **6 advisories (5 moderate, 1 high)**.
Below is each one with its practical relevance to *this* (static, trusted-content)
site. These reflect a point-in-time scan and should be re-checked with
`npm audit` — they are not a substitute for it.

| Package | Severity | Advisory (summary) | Relevance here |
|---------|:--------:|--------------------|----------------|
| `next-mdx-remote` | **high** | Arbitrary code execution when server-side rendering **untrusted** MDX. | Low in practice — MDX is first-party/build-time (see trust boundary above). Still worth tracking/upgrading. |
| `dompurify` (via `mermaid`) | moderate | Trusted-Types / sanitizer bypass issues. | Limited — Mermaid runs `securityLevel: strict` on first-party diagram source. |
| `js-yaml` (via `gray-matter`) | moderate | Quadratic-complexity DoS via merge keys/aliases. | Build-time only; input is first-party frontmatter. |
| `gray-matter` | moderate | Inherits the `js-yaml` issue. | Build-time only. |
| `postcss` | moderate | XSS via unescaped `</style>` in stringify output. | Build-time CSS tooling; not processing untrusted input. |
| `next` (via `postcss`) | moderate | Transitive of the `postcss` advisory. | Build-time. |

**Common thread:** every one of these is reachable only through *build-time*
processing of *first-party* input, or through rendering *untrusted* content the
site does not accept. None is exposed to anonymous runtime user input. They should
still be remediated on a normal cadence (`npm audit fix` / dependency bumps) —
see [HARDENING.md](HARDENING.md) for the recommended process.

## Known gaps (summary)

These are **not** present and are documented honestly (details + recommendations
in [HARDENING.md](HARDENING.md)):

- No HTTP **security headers / Content-Security-Policy** are configured (no
  `headers()` in [next.config.ts](../next.config.ts)); header policy currently
  depends entirely on the (unconfigured) hosting layer.
- No **automated dependency scanning** (Dependabot/Renovate/SCA) in CI.
- No **tests** (including no security/regression tests).
- No `SECURITY.md` disclosure policy at the repo root and no security contact.

## Reporting a vulnerability

There is no published disclosure policy in the repository today. Until one exists,
report suspected issues privately to the maintainers (the project's public contact
channels are listed in `EXTERNAL` / `ORG.sameAs` in
[config.ts](../src/lib/config.ts)) rather than opening a public issue.
