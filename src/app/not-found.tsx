import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Newsreader, Caveat, JetBrains_Mono } from "next/font/google";
import { DEFAULT_LOCALE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-script" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono" });

/**
 * Global 404. Rendered outside the `[locale]` layout, so it supplies its own
 * `<html>`/`<body>`. Defaults to the site's primary locale.
 */
export default function NotFound() {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${inter.variable} ${newsreader.variable} ${caveat.variable} ${jetbrains.variable} bg-paper text-ink`}
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <div className="paper relative isolate flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <p className="eyebrow text-moss">404</p>
            <h1 className="display mt-3 text-[40px] text-ink">Page not found</h1>
            <p className="mt-3 text-ink-muted">
              This page may have moved or doesn&apos;t exist in this language.
            </p>
            <Link
              href={`/${DEFAULT_LOCALE}`}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-moss-deep"
            >
              ← Back to docs home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
