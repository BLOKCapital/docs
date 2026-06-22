import type { NextConfig } from "next";

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

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["flexsearch"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
