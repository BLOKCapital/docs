# Security Policy

## Scope

This repository contains the **BLOK Capital documentation website** — the
source for [docs.blokcapital.io](https://docs.blokcapital.io). It does **not**
contain the protocol's smart contracts.

- **Website / this repo** (XSS, dependency CVEs, build/CI issues, content
  integrity): report as described below.
- **Protocol / smart-contract vulnerabilities** (the on-chain Diamond, facets,
  Gardens, oracles): please use BLOK Capital's protocol security program, not
  this repo. Do not file on-chain vulnerabilities as public GitHub issues.

## Reporting a vulnerability

**Do not open a public issue for security problems.** Instead:

- Email **security@blokcapital.io** with a description, affected URLs/files, and
  reproduction steps. *(Maintainers: confirm or update this address.)*
- Alternatively, use GitHub's **private vulnerability reporting** (the "Report a
  vulnerability" button under the repository's *Security* tab), if enabled.

Please include enough detail to reproduce the issue. We aim to acknowledge
reports within a few business days and will keep you updated on remediation.

## Supported versions

The site is continuously deployed from `main`; only the latest deployed version
is supported. Fixes land on `main` and ship on the next deploy.

## Hardening already in place

- Baseline security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) via `next.config.ts`.
- Automated dependency updates (Dependabot) and an `npm audit` step in CI.
- Build-time content validation (`npm run check:content`).
