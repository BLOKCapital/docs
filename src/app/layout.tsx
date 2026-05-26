import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · BLOK Capital`,
    template: "%s · BLOK Capital Docs",
  },
  description: SITE.tagline,
  openGraph: { title: SITE.name, description: SITE.tagline, type: "website", siteName: SITE.name },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F0",
  colorScheme: "light",
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
