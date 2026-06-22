# Appendix — Hardening & Gap Analysis

> ⚠️ **This document is RECOMMENDATIONS, not current state.** Unlike the rest of
> [docs/](.), which describes only what exists in the repository, this appendix
> intentionally identifies what is **missing** and what a senior engineering,
> security, and DevOps review would suggest adding. Nothing here is implemented
> today. Each item notes the gap, the risk, and a concrete suggestion.

The gaps below are real (verified against the repo), but the project is a static
documentation site, so most are **low urgency**. They are ordered roughly by
value-to-effort.

## 1. HTTP security headers / Content-Security-Policy — *missing*

**Gap.** [next.config.ts](../next.config.ts) defines no `headers()` function, so
the app ships no `Content-Security-Policy`, `X-Content-Type-Options`,
`Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, or
`Permissions-Policy`. Header behavior depends entirely on the (uncommitted)
hosting layer.

**Risk.** Lower for a static site with no auth/cookies, but a CSP meaningfully
reduces the blast radius of any future XSS and is table-stakes for a
public-facing property. Clickjacking and MIME-sniffing protections are free wins.

**Suggestion.** Add a `headers()` block to `next.config.ts`, e.g. a
`Content-Security-Policy` (note: KaTeX/Shiki inline styles and the
`application/ld+json` scripts must be accommodated; Mermaid renders inline SVG),
plus `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or CSP
`frame-ancestors`), and `Permissions-Policy`. Validate with
[securityheaders.com](https://securityheaders.com) after deploy.

## 2. Automated tests — *none*

**Gap.** No test framework or tests exist (no Jest/Vitest/Playwright/Cypress).

**Risk.** The content **loader** ([content.ts](../src/lib/content.ts)), **TOC/slug
parity** ([toc.ts](../src/lib/toc.ts) vs. `rehype-slug`), **SEO builders**
([seo.tsx](../src/lib/seo.tsx)), and **search ranking**
([SearchDialog.tsx](../src/components/search/SearchDialog.tsx)) contain non-trivial
logic that is currently only covered transitively by "does the build pass."
Regressions in slug generation silently break TOC/search deep links.

**Suggestion.**
- **Unit (Vitest):** `excerpt`, `extractFaq`, `toPlainText`, `languageAlternates`,
  `extractToc` (assert slug parity with `rehype-slug` on fixtures), `flattenNav`
  ordering, `getDoc` resolution.
- **E2E (Playwright):** smoke-test a doc page render, `⌘K` search → result →
  navigation, and the locale switcher preserving the path.
- Wire both into [CI](CI_CD_AND_OPERATIONS.md) as steps before `build`.

## 3. Dependency scanning & updates — *not automated*

**Gap.** No Dependabot/Renovate config; no SCA step in CI. `npm audit` currently
reports 6 advisories (see [SECURITY.md](SECURITY.md#dependency-security-npm-audit)).

**Risk.** Advisories accrue silently; the `next-mdx-remote` high-severity item in
particular should be tracked even though current exposure is low (trusted MDX).

**Suggestion.** Add `.github/dependabot.yml` (npm + github-actions ecosystems,
weekly) or Renovate, and an `npm audit --audit-level=high` step in CI (start as
non-blocking to avoid surprise breakage, then tighten). Schedule periodic
`npm audit fix` / major-bump PRs.

## 4. Reproducible deployment — *not in repo*

**Gap.** No committed deploy configuration or deploy workflow; CI builds but never
deploys. The actual hosting/CDN/DNS/TLS setup is external and undocumented here.

**Risk.** "Works on my machine" deploys; no audit trail of how production is
published; bus-factor on whoever holds the hosting credentials.

**Suggestion.** Commit the deployment as code — either a host config
(`vercel.json`/equivalent) **or** a `deploy` GitHub Actions job gated on `main`
that builds and publishes. Document the production URL, host, and rollback
procedure in [CI_CD_AND_OPERATIONS.md](CI_CD_AND_OPERATIONS.md). If containerized
delivery is ever desired, a small multi-stage Dockerfile (`next build` →
`next start`, or a static export served by a CDN) would make environments
reproducible.

## 5. Repository security hygiene — *partial*

**Gaps & suggestions.**
- **No root `SECURITY.md` disclosure policy / security contact.** Add one with a
  private reporting channel (and consider GitHub private vulnerability reporting).
- **No `CODEOWNERS`.** Add one so content vs. code changes route to the right
  reviewers — reinforcing the "MDX is reviewed" trust assumption that
  [SECURITY.md](SECURITY.md#trust-boundary-mdx-content) depends on.
- **No branch-protection-as-docs.** Ensure `main` requires the `verify` check and
  review before merge (configured in GitHub settings, not the repo — document it).
- **No PR/issue templates.**

## 6. Accessibility & quality gates — *manual only*

**Gap.** The components show good a11y discipline (skip link, ARIA roles on
search/nav, `aria-current`, focus management) but nothing **enforces** it, and
there's no Lighthouse/axe budget in CI.

**Suggestion.** Add an automated a11y pass (axe via Playwright, or
Lighthouse CI) and, optionally, a link-checker for **external** links (the
in-repo validator only checks internal links).

## 7. Content & i18n completeness — *warnings only*

**Gap.** [check-content.ts](../scripts/check-content.ts) reports locale-parity gaps
and missing `description`s as **warnings**, so they don't block merges. The last
run showed parity gaps and missing descriptions in several `fr`/`es` pages.

**Suggestion.** Decide a policy: either (a) keep as warnings but surface the count
in PRs, or (b) promote specific checks (e.g. missing `description` on `en`) to
errors once the backlog is cleared. Track translation parity as an explicit
backlog rather than relying on warning noise.

## 8. Performance headroom — *good, minor opportunities*

**Observations (not defects).** The site is fully static, code-splits Mermaid, and
lazy-loads content images. Possible refinements: add explicit `width`/`height` (or
aspect-ratio) to content images to reduce CLS; consider self-hosting/subsetting
KaTeX fonts if the math CSS proves heavy; verify the per-locale search JSON size
stays reasonable as content grows (the index caps body text at 4000 chars, which
helps).

---

### Priority shortlist

If only a few are actioned, do these first:

1. **Security headers + CSP** (#1) — highest security ROI for a public site.
2. **Dependabot + `npm audit` in CI** (#3) — keeps the dependency surface honest.
3. **Deployment as code** (#4) — removes the biggest operational unknown.
4. **A thin test layer** (#2) — protect slug/SEO/search logic from silent
   regressions.
