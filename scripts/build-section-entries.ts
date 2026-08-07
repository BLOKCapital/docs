/**
 * Emit src/lib/generated/section-entries.json — the first real doc in each
 * section, per locale:
 *
 *   { "en": { "concepts": "/en/concepts/blok-c-overview", … }, … }
 *
 * Consumed by `next.config.ts` to build routing-layer redirects for the docs
 * root and the four section roots. Those URLs hold no content of their own, so
 * they redirect into the docs rather than rendering a grid of link cards.
 *
 * It has to be a build artifact because `next.config.ts` is evaluated before
 * the app's module graph exists and cannot import the content helpers, and
 * because the redirect targets follow the sidebar ordering (frontmatter
 * `position`, `_category.json`) rather than anything hardcoded — reorder the
 * content and the redirects follow.
 */
import fs from "node:fs";
import path from "node:path";
import { LOCALES, SECTIONS } from "../src/lib/config";
import { getSectionNav, flattenNav } from "../src/lib/content";

const GENERATED = path.join(process.cwd(), "src", "lib", "generated");

function build() {
  const out: Record<string, Record<string, string>> = {};
  const missing: string[] = [];

  for (const locale of LOCALES) {
    out[locale] = {};
    for (const s of SECTIONS) {
      const first = flattenNav(getSectionNav(locale, s.slug))[0];
      if (!first) {
        missing.push(`${locale}/${s.slug}`);
        continue;
      }
      out[locale][s.slug] = first.href;
    }
  }

  if (missing.length) {
    console.warn(`[sections] no docs found for: ${missing.join(", ")}`);
  }

  fs.mkdirSync(GENERATED, { recursive: true });
  fs.writeFileSync(
    path.join(GENERATED, "section-entries.json"),
    JSON.stringify(out, null, 2) + "\n",
  );

  const n = Object.values(out).reduce((a, m) => a + Object.keys(m).length, 0);
  console.log(`sections: ${n} entry points across ${LOCALES.length} locales`);
}

build();
