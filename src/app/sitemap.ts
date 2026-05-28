import type { MetadataRoute } from "next";
import { LOCALES, SECTIONS } from "@/lib/config";
import { getAllDocs } from "@/lib/content";
import { absoluteUrl, languageAlternates } from "@/lib/seo";

/**
 * XML sitemap covering every indexable URL: locale homes, the four section
 * landings, and all docs, across all locales. Each entry carries `alternates`
 * (hreflang) so engines understand the language cluster and pick the right
 * version per user.
 *
 * Statically generated alongside the rest of the SSG output; served at
 * /sitemap.xml. The default locale (en) drives lastModified ordering.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const add = (
    pathAfterLocale: string,
    opts: { priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] },
  ) => {
    const suffix = pathAfterLocale ? `/${pathAfterLocale}` : "";
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(`/${locale}${suffix}`),
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates: { languages: languageAlternates(pathAfterLocale) },
      });
    }
  };

  // Locale homes.
  add("", { priority: 1, changeFrequency: "weekly" });

  // Section landings.
  for (const s of SECTIONS) {
    add(s.slug, { priority: 0.8, changeFrequency: "weekly" });
  }

  // Every doc (segments already include the section slug). Use the default
  // locale's tree as the canonical set; all locales mirror the same routes.
  for (const doc of getAllDocs(LOCALES[0])) {
    add(doc.segments.join("/"), { priority: 0.7, changeFrequency: "monthly" });
  }

  return entries;
}
