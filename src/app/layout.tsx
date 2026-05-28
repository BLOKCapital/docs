import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SITE, SITE_KEYWORDS, TWITTER_HANDLE } from "@/lib/config";
import { OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}: Decentralized Wealth Management Protocol`,
    template: `%s · ${SITE.brand} Docs`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE.brand, url: SITE.siteUrl }],
  creator: SITE.brand,
  publisher: SITE.brand,
  category: "technology",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: SITE.name,
    description: SITE.description,
    images: [OG_IMAGE.url],
  },
  // Drop in real tokens when verifying ownership with each engine.
  verification: {
    // google: "<google-site-verification-token>",
    // other: { "msvalidate.01": "<bing-token>" },
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

/**
 * Pass-through root layout. The `<html>`/`<body>` tags (and the `lang`
 * attribute) live in `[locale]/layout.tsx`, where the active locale is known.
 * Root-level routes that render outside the locale tree (e.g. `not-found`)
 * supply their own `<html>`/`<body>`.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
