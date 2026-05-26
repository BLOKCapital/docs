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
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "public", "search");

const LOCALES = ["en", "es", "fr"];
const SECTIONS = [
  { slug: "concepts", dir: "concepts" },
  { slug: "smart-contracts", dir: "smart-contracts" },
  { slug: "builders", dir: "builders" },
  { slug: "resources", dir: "resources" },
];

function titleFromSlug(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Strip MDX/markdown syntax down to plain searchable text. */
function toPlainText(body) {
  return body
    .replace(/```[\s\S]*?```/g, " ")          // fenced code
    .replace(/`[^`]*`/g, " ")                  // inline code
    .replace(/^import .*$/gm, " ")             // mdx imports
    .replace(/<[^>]+>/g, " ")                  // jsx/html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")     // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")   // links → text
    .replace(/[#>*_~|-]/g, " ")                // md punctuation
    .replace(/:::[a-z]*/g, " ")                // admonition fences
    .replace(/\s+/g, " ")
    .trim();
}

function collectHeadings(body) {
  const out = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^#{2,3}\s+(.+?)\s*#*\s*$/);
    if (m) out.push(m[1].replace(/[*_`]/g, "").trim());
  }
  return out;
}

function walk(dir, section, parentSegments, locale, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, section, [...parentSegments, entry.name], locale, out);
    } else if (/\.mdx?$/.test(entry.name)) {
      const base = entry.name.replace(/\.mdx?$/, "");
      const segments = base === "index" ? parentSegments : [...parentSegments, base];
      const { data, content } = matter(fs.readFileSync(full, "utf8"));
      const title = data.title ?? titleFromSlug(segments[segments.length - 1] ?? section);
      const text = toPlainText(content);
      out.push({
        href: `/${locale}/${segments.join("/")}`,
        title,
        section,
        description: data.description ?? "",
        headings: collectHeadings(content),
        text: text.slice(0, 1200),
      });
    }
  }
}

function build() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let total = 0;
  for (const locale of LOCALES) {
    const records = [];
    for (const { slug, dir } of SECTIONS) {
      walk(path.join(CONTENT, locale, dir), slug, [slug], locale, records);
    }
    records.forEach((r, i) => (r.id = i));
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
