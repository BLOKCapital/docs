import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/config";
import { getAllDocs, localesWithDoc } from "@/lib/content";
import { absoluteUrl, languageAlternates } from "@/lib/seo";

/**
 * XML sitemap of every indexable URL, each carrying its `alternates` (hreflang)
 * so engines understand the language cluster and serve the right version.
 *
 * Two things are deliberately excluded:
 *
 *  - The locale homes and the four section roots. They hold no content of their
 *    own and now redirect into the docs, so listing them would hand engines
 *    thin pages that compete with — and can rank instead of — the page that
 *    actually answers the query. Submitting only destinations is what gets a
 *    searcher dropped straight onto the right page.
 *  - Locales a given page hasn't been translated into. Content parity isn't
 *    guaranteed, and listing a URL that 404s is a soft-404 in Search Console.
 *
 * Statically generated alongside the rest of the SSG output; served at
 * /sitemap.xml.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const doc of getAllDocs(locale)) {
      const pathAfterLocale = doc.segments.join("/");
      entries.push({
        url: absoluteUrl(`/${locale}/${pathAfterLocale}`),
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: languageAlternates(
            pathAfterLocale,
            localesWithDoc(pathAfterLocale),
          ),
        },
      });
    }
  }

  return entries;
}
