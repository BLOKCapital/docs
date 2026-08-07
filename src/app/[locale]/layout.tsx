import { Inter, Newsreader, Caveat, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/footer/Footer";
import { SearchProvider } from "@/components/search/SearchContext";
import { DocNavProvider } from "@/components/docs/DocNavContext";
import { getSectionEntries } from "@/lib/content";
import { LOCALES, UI, isLocale, type Locale } from "@/lib/config";
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
  const t = UI[loc];

  return (
    <html
      lang={loc}
      className={`${inter.variable} ${newsreader.variable} ${caveat.variable} ${jetbrains.variable} bg-paper text-ink`}
      suppressHydrationWarning
    >
      <head>
        {/* Agent discovery, as metadata rather than as body copy — the previous
            visually-hidden <p> contained a real link, so the first Tab press
            landed a sighted keyboard user on something they couldn't see. */}
        <link rel="alternate" type="text/markdown" href="/llms.txt" title="Documentation index for AI agents" />
      </head>
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        {/* Site-wide entity graph: Organization + WebSite (with SearchAction). */}
        <JsonLd data={[organizationLd(), websiteLd(loc)]} />
        <a
          href="#main-content"
          className="sr-only z-50 rounded-full bg-moss px-4 py-2 text-sm font-medium text-paper focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          {t.skipToContent}
        </a>
        {/* Same directive in prose form for crawlers that read the body. Not
            focusable: `sr-only` hides it visually but keeps it in the tab
            order, so the link inside is marked unreachable by keyboard. */}
        <p className="sr-only" data-llms-directive>
          For AI agents: a documentation index is available at{" "}
          <a href="/llms.txt" tabIndex={-1}>
            /llms.txt
          </a>
          . Every page is also available as Markdown at the same URL with a{" "}
          <code>.md</code> suffix, or by requesting{" "}
          <code>Accept: text/markdown</code>.
        </p>
        <SearchProvider>
          <DocNavProvider>
            <Nav locale={loc} sectionEntries={getSectionEntries(loc)} />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer locale={loc} />
          </DocNavProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
