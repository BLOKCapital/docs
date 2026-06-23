/**
 * Shared content helpers for build-time scripts (search index + validation).
 *
 * LOCALES and SECTIONS are imported from `src/lib/config.ts` (the runtime
 * source of truth) and re-exported here, so the build scripts and the app
 * share exactly one definition — config drift is structurally impossible.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import { LOCALES, SECTIONS, isLocale } from "../src/lib/config";

export { LOCALES, SECTIONS, isLocale };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const CONTENT = path.join(ROOT, "content");

export type Heading = { text: string; slug: string };

/** A single content document discovered by {@link walkLocale}. */
export type Doc = {
  locale: string;
  section: string;
  segments: string[];
  href: string;
  file: string;
  data: Record<string, unknown>;
  content: string;
};

export function titleFromSlug(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const TOKEN_DATA = path.join(ROOT, "src", "lib", "data", "tokenData.json");
const ADMONITION_LABELS: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  info: "Info",
  warning: "Warning",
  danger: "Danger",
};

/**
 * Expand the few content-bearing MDX components into plain Markdown so a page's
 * `.md` twin carries the same text its HTML renders (AFDocs
 * markdown-content-parity). `<Chart />` becomes the token-distribution table it
 * draws from tokenData.json; `<Admonition>` becomes a titled paragraph. Inline
 * components (FacetName, MethodName, …) only ever appear inside code fences, so
 * they render identically in Markdown and HTML and need no expansion.
 */
export function expandMdxForText(content: string): string {
  let out = content;
  if (/<Chart\s*\/>/.test(out)) {
    const data = JSON.parse(fs.readFileSync(TOKEN_DATA, "utf8")) as Array<{
      title: string;
      value: number;
      description: string;
    }>;
    const rows = data
      .map((d) => `| ${d.title} | ${d.value}% | ${d.description} |`)
      .join("\n");
    const table = `**$BLOKC token distribution**\n\n| Allocation | Share | Purpose |\n| --- | --- | --- |\n${rows}`;
    out = out.replace(/<Chart\s*\/>/g, table);
  }
  out = out.replace(/<Admonition\b([^>]*)>/g, (_m, attrs: string) => {
    const title = /title="([^"]*)"/.exec(attrs)?.[1];
    const kind = /kind="([^"]*)"/.exec(attrs)?.[1] ?? "note";
    return `**${title || ADMONITION_LABELS[kind] || "Note"}**\n\n`;
  });
  return out.replace(/<\/Admonition>/g, "");
}

/** Strip MDX/markdown syntax down to plain searchable text. */
export function toPlainText(body: string): string {
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

/**
 * Extract code identifiers so devs can search for symbols (`diamondCut`,
 * `IIndex.sol`, `LibDiamond`, contract addresses) — `toPlainText` strips all
 * code, so without this they'd be unsearchable. Pulls tokens out of fenced and
 * inline code plus any PascalCase / dotted / `.sol` identifiers in prose, keeps
 * only symbol-shaped ones (mixed case, underscore, dot, or hex address), dedupes
 * and caps. The client encoder later splits each into searchable subwords.
 */
export function collectSymbols(body: string): string[] {
  const regions: string[] = [];
  for (const m of body.matchAll(/```[\s\S]*?```|`[^`]+`/g)) regions.push(m[0]);
  // Symbol-shaped tokens still in prose (component names, FileNames.sol, addresses).
  for (const m of body.matchAll(/\b[A-Za-z_$][A-Za-z0-9_$]*\.sol\b|\b0x[0-9a-fA-F]{6,}\b|\b[A-Z][a-zA-Z0-9]*[a-z][A-Z][A-Za-z0-9]*\b/g))
    regions.push(m[0]);

  const out = new Set<string>();
  const blob = regions.join(" ");
  for (const m of blob.matchAll(/0x[0-9a-fA-F]{6,}|[A-Za-z_$][A-Za-z0-9_$.]*/g)) {
    const tok = m[0].replace(/^\.+|\.+$/g, "");
    if (tok.length < 2 || tok.length > 48) continue;
    const symbolic =
      /[a-z][A-Z]|[A-Z].*[A-Z]/.test(tok) || // camelCase / PascalCase / ALLCAPS
      tok.includes("_") ||
      tok.includes(".") ||
      /^0x/.test(tok);
    if (symbolic) out.add(tok);
    if (out.size >= 120) break;
  }
  return [...out];
}

/**
 * Collect h2/h3 headings with their anchor slugs so search can deep-link to a
 * section. A single GithubSlugger is advanced over *every* heading (h1–h6) in
 * document order — the same way rehype-slug runs per page — so duplicate-slug
 * suffixes (`-1`, `-2`) match the ids actually rendered into the DOM.
 */
export function collectHeadings(body: string): Heading[] {
  const out: Heading[] = [];
  const slugger = new GithubSlugger();
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].replace(/[*_`]/g, "").trim();
    const slug = slugger.slug(text); // advance for all levels to mirror rehype
    if (level >= 2 && level <= 3) out.push({ text, slug });
  }
  return out;
}

/**
 * Walk content/<locale>/<section>/** and yield a record per doc:
 * { locale, section, segments, href, file, data, content }.
 */
export function walkLocale(locale: string): Doc[] {
  const out: Doc[] = [];
  for (const { slug, dir } of SECTIONS) {
    walk(path.join(CONTENT, locale, dir), slug, [slug], locale, out);
  }
  return out;
}

function walk(
  dir: string,
  section: string,
  parentSegments: string[],
  locale: string,
  out: Doc[],
): void {
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
