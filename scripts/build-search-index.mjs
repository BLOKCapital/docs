/**
 * Build-time search index generator.
 *
 * Walks content/<locale>/<section>/** and emits public/search/<locale>.json —
 * a flat array of { href, title, section, headings, text }. The client loads
 * its locale file and builds a FlexSearch index in the browser. Runs via the
 * `predev` / `prebuild` npm hooks so the index is always fresh.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  LOCALES,
  walkLocale,
  titleFromSlug,
  toPlainText,
  collectHeadings,
} from "./_content.mjs";

const OUT_DIR = path.join(ROOT, "public", "search");

function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let total = 0;
  for (const locale of LOCALES) {
    const records = walkLocale(locale).map((doc, id) => ({
      id,
      href: doc.href,
      title:
        doc.data.title ??
        titleFromSlug(doc.segments[doc.segments.length - 1] ?? doc.section),
      section: doc.section,
      description: doc.data.description ?? "",
      headings: collectHeadings(doc.content),
      text: toPlainText(doc.content).slice(0, 1200),
    }));
    fs.writeFileSync(
      path.join(OUT_DIR, `${locale}.json`),
      JSON.stringify(records),
    );
    total += records.length;
    console.log(`search index: ${locale} → ${records.length} docs`);
  }
  console.log(`search index: ${total} docs across ${LOCALES.length} locales`);
}

build();
