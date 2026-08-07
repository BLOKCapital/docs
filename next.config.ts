import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Baseline security headers applied to every route.
 *
 * A full Content-Security-Policy is intentionally NOT set here: the App Router
 * needs a per-request nonce (via middleware) to allow Next's inline bootstrap
 * script, and KaTeX/Mermaid inject inline styles — so a CSP must be rolled out
 * in `Content-Security-Policy-Report-Only` first and tuned against the running
 * site before it can be enforced. Tracked as a follow-up.
 */
const securityHeaders = [
  // Force HTTPS for two years, including subdomains; eligible for preload list.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disable MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow framing (clickjacking protection). Switch to SAMEORIGIN if the
  // docs ever need to be embedded.
  { key: "X-Frame-Options", value: "DENY" },
  // Send only the origin on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop powerful features this static docs site never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// Agent-facing text endpoints (the `.md` twins, llms.txt, llms-full.txt) get a
// short, revalidating cache so AI crawlers see content updates within the hour
// rather than holding a day-stale copy — AFDocs `cache-header-hygiene`. The
// regex params match any path ending in the extension, across all locales.
const agentTextCache = [
  {
    key: "Cache-Control",
    value: "public, max-age=3600, must-revalidate",
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["flexsearch"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:file(.*\\.md)", headers: agentTextCache },
      { source: "/:file(.*\\.txt)", headers: agentTextCache },
    ];
  },
  // The bare root must hand back a real HTTP 308 to the default locale. The
  // former page-level redirect() got statically prerendered into a 200 "soft"
  // (JS) redirect on Cloudflare Pages — an empty shell with a Location header —
  // which crawlers (incl. AFDocs / Agent Score) see as a contentless page and
  // score 0. A config redirect is resolved at the routing layer, before any
  // render, so it emits a proper 308 that agents and browsers both follow.
  async redirects() {
    // The docs root and the four section roots carry no content of their own —
    // they used to render a grid of link cards. Each now redirects to the first
    // real doc beneath it, so every indexable URL is a page that answers
    // something and a searcher lands on the answer rather than on an index.
    //
    // These live here, not in the page components, for the same reason as the
    // root redirect above: a page-level redirect() is prerendered into a soft
    // 200 shell, which crawlers read as a contentless page. Targets come from
    // section-entries.json (written by scripts/build-section-entries.ts) so
    // they track the sidebar ordering instead of being hardcoded.
    //
    // `permanent: true` (308) is deliberate: these URLs were previously
    // indexed, and a permanent redirect is what tells search engines to pass
    // their ranking signals to the destination and drop the old URL.
    const sectionEntries = JSON.parse(
      readFileSync(
        join(process.cwd(), "src/lib/generated/section-entries.json"),
        "utf8",
      ),
    ) as Record<string, Record<string, string>>;

    // The bare root goes straight to the default locale's first doc — via
    // `/en` it would cost a second hop for every inbound link to the domain.
    const defaultEntry = Object.values(sectionEntries.en ?? {})[0] ?? "/en";
    const rules = [{ source: "/", destination: defaultEntry, permanent: true }];
    for (const [locale, sections] of Object.entries(sectionEntries)) {
      const first = Object.values(sections)[0];
      if (first) {
        rules.push({ source: `/${locale}`, destination: first, permanent: true });
      }
      for (const [section, destination] of Object.entries(sections)) {
        rules.push({
          source: `/${locale}/${section}`,
          destination,
          permanent: true,
        });
      }
    }
    return rules;
  },
};

export default config;
