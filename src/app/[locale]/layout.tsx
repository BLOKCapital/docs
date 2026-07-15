import { Inter, Newsreader, Caveat, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/footer/Footer";
import { SearchProvider } from "@/components/search/SearchContext";
import { LOCALES, isLocale, type Locale } from "@/lib/config";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-script" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
  // next/font's auto metric-adjusted fallback is sans-serif and renders Unicode
  // Block Elements (used in ASCII-art banners, absent from the latin subset)
  // oversized. Disable it and fall back to a real monospace so those glyphs are
  // cell-sized and tile correctly.
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SF Mono", "Menlo", "Cascadia Mono", "Consolas", "DejaVu Sans Mono", "monospace"],
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;

  return (
    <html
      lang={loc}
      className={`${inter.variable} ${newsreader.variable} ${caveat.variable} ${jetbrains.variable} bg-paper text-ink`}
    >
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        {/* Site-wide entity graph: Organization + WebSite (with SearchAction). */}
        <JsonLd data={[organizationLd(), websiteLd(loc)]} />
        <a
          href="#main-content"
          className="sr-only z-50 rounded-full bg-moss px-4 py-2 text-sm font-medium text-paper focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {/* Agent discovery directive (AFDocs `llms-txt-directive-html`): a
            visually-hidden pointer near the top of every page so AI crawlers
            find the Markdown index and per-page Markdown twins. */}
        <p className="sr-only" data-llms-directive>
          For AI agents: a documentation index is available at{" "}
          <a href="/llms.txt">/llms.txt</a>. Every page is also available as
          Markdown at the same URL with a <code>.md</code> suffix, or by
          requesting <code>Accept: text/markdown</code>.
        </p>
        <SearchProvider>
          <Nav locale={loc} />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer locale={loc} />
        </SearchProvider>
      </body>
    </html>
  );
}
