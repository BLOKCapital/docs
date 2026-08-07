import { notFound, redirect } from "next/navigation";
import { isLocale, SECTIONS, type Locale } from "@/lib/config";
import { getSectionEntry } from "@/lib/content";

/**
 * The docs root is a shortcut, not a destination.
 *
 * It used to be a grid of link cards — a page with no content of its own that
 * still competed for search impressions and put an extra click between a
 * searcher and the page that actually answers them. It now redirects straight
 * into the docs, the way Tailwind's, Prisma's and Stripe's roots do, and it is
 * excluded from the sitemap so only real content is indexed.
 */
export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(getSectionEntry(locale as Locale, SECTIONS[0].slug));
}
