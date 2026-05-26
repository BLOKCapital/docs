/**
 * Shared content helpers for build-time scripts (search index + validation).
 *
 * NOTE: LOCALES and SECTIONS are mirrored in `src/lib/config.ts` (the runtime
 * source of truth). `scripts/check-content.mjs` asserts the two stay in sync,
 * so drift is caught in CI rather than silently.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const CONTENT = path.join(ROOT, "content");

export const LOCALES = ["en", "es", "fr"];
export const SECTIONS = [
  { slug: "concepts", dir: "concepts" },
  { slug: "smart-contracts", dir: "smart-contracts" },
  { slug: "builders", dir: "builders" },
  { slug: "resources", dir: "resources" },
];

export function titleFromSlug(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Strip MDX/markdown syntax down to plain searchable text. */
export function toPlainText(body) {
  return body
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/^import .*$/gm, " ") // mdx imports
    .replace(/<[^>]+>/g, " ") // jsx/html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/[#>*_~|-]/g, " ") // md punctuation
    .replace(/:::[a-z]*/g, " ") // admonition fences
    .replace(/\s+/g, " ")
    .trim();
}

export function collectHeadings(body) {
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

/**
 * Walk content/<locale>/<section>/** and yield a record per doc:
 * { locale, section, segments, href, file, data, content }.
 */
export function walkLocale(locale) {
  const out = [];
  for (const { slug, dir } of SECTIONS) {
    walk(path.join(CONTENT, locale, dir), slug, [slug], locale, out);
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
      out.push({
        locale,
        section,
        segments,
        href: `/${locale}/${segments.join("/")}`,
        file: path.relative(ROOT, full),
        data,
        content,
      });
    }
  }
}
