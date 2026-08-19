import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/config";

/**
 * Google Analytics 4 (gtag.js).
 *
 * Rendered once per document shell — `[locale]/layout.tsx` for the site proper
 * and `not-found.tsx`, which supplies its own `<html>`/`<body>` and would
 * otherwise leave 404s uninstrumented.
 *
 * Notes on the shape of this:
 *
 * - `afterInteractive` loads the tag once the page is interactive rather than
 *   blocking first paint. Analytics is never on the critical path, and this is
 *   the strategy Google's own snippet's `async` attribute is reaching for.
 * - Both tags are required, but their relative order isn't: the inline one
 *   defines `window.dataLayer`/`gtag` and queues the initial `js` + `config`
 *   calls, which gtag.js drains whenever it arrives. Ship one without the
 *   other and nothing is recorded.
 * - No route-change listener. App Router client navigations go through the
 *   History API, which GA4's "page changes based on browser history events"
 *   enhanced measurement already reports. Sending our own `page_view` on top
 *   would double-count every in-site navigation. If that enhanced-measurement
 *   toggle is ever turned off in the GA property, this is the place to add an
 *   explicit `usePathname()` effect instead.
 * - Dev and preview builds are excluded so local browsing doesn't land in the
 *   production property.
 */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production" || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        id="ga-tag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
