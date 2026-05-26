import { Inter, Newsreader, Caveat, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/footer/Footer";
import { SearchProvider } from "@/components/search/SearchContext";
import { LOCALES, isLocale, type Locale } from "@/lib/config";

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
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <SearchProvider>
          <Nav locale={loc} />
          {children}
          <Footer />
        </SearchProvider>
      </body>
    </html>
  );
}
