import { notFound } from "next/navigation";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/footer/Footer";
import { SearchProvider } from "@/components/search/SearchContext";
import { LOCALES, isLocale, type Locale } from "@/lib/config";

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
    <SearchProvider>
      <Nav locale={loc} />
      {children}
      <Footer locale={loc} />
    </SearchProvider>
  );
}
