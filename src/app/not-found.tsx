import type { Metadata } from "next";
import { Inter, Newsreader, Caveat, JetBrains_Mono } from "next/font/google";
import { NotFoundContent } from "@/components/docs/NotFoundContent";
import { getSectionEntries } from "@/lib/content";
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type SectionSlug,
} from "@/lib/config";

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
 * The site's 404, for every unmatched path.
 *
 * Next renders a `notFound()` boundary under the root layout only, and this
 * app's `<html>`/`<body>` and navigation live in `[locale]/layout.tsx` — so a
 * nested `[locale]/not-found.tsx` would render without any of that chrome. This
 * page therefore supplies its own document shell, and `NotFoundContent` brings
 * its own header, section links and footer, localized from the pathname.
 */
export default function NotFound() {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${inter.variable} ${newsreader.variable} ${caveat.variable} ${jetbrains.variable} bg-paper text-ink`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {/* Computed here (a Server Component) and handed down for every locale:
            NotFoundContent recovers the locale from the pathname on the client,
            and can't read the content tree itself. */}
        <NotFoundContent
          sectionEntries={Object.fromEntries(
            LOCALES.map((l) => [l, getSectionEntries(l)]),
          ) as Record<Locale, Record<SectionSlug, string>>}
        />
      </body>
    </html>
  );
}
