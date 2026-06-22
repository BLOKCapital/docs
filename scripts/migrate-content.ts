/**
 * One-shot migration: Docusaurus content → blok-docs content/<locale>/<section>.
 *
 * Run from blok-docs root:  tsx scripts/migrate-content.ts "<absolute path to documentation repo>"
 *
 * Transforms per file:
 *  - frontmatter: sidebar_position→position, keep title/description/sidebar_label, drop id
 *  - derive title from leading "# H1" when missing; strip a leading H1 that
 *    duplicates the title (the page template renders the title itself)
 *  - admonitions  :::kind … :::  →  <Admonition kind="…">…</Admonition>
 *  - drop  `import X from '@site/…'`  lines (components are provided by the renderer)
 *  - rewrite section-prefixed internal links to /<locale>/<section>/… and strip .md(x)
 *  - copy _category_.json → _category.json
 *  - copy static/img → public/img (once)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { LOCALES, SECTIONS } from "../src/lib/config";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error("Usage: tsx scripts/migrate-content.ts <path-to-documentation-repo>");
  process.exit(1);
}
const DOCS_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(DOCS_ROOT, "content");

/** source dir (relative to SRC) for a (locale, section). */
function srcDir(locale: string, section: string): string {
  if (locale === "en") {
    const map: Record<string, string> = {
      concepts: "educ-docs",
      "smart-contracts": "docs/v1",
      builders: "builders-docs",
      resources: "resources-docs",
    };
    return map[section];
  }
  const base = `i18n/${locale}`;
  const map: Record<string, string> = {
    concepts: `${base}/docusaurus-plugin-content-docs-educ/current`,
    "smart-contracts": `${base}/docusaurus-plugin-content-docs/current/v1`,
    builders: `${base}/docusaurus-plugin-content-docs-builders/current`,
    resources: `${base}/docusaurus-plugin-content-docs-resources/current`,
  };
  return map[section];
}

const ADMONITION_KIND: Record<string, string> = {
  note: "note",
  tip: "tip",
  info: "info",
  important: "info",
  warning: "warning",
  caution: "warning",
  danger: "danger",
};

const SECTION_OF_PREFIX: Record<string, string> = {
  educ: "concepts",
  v1: "smart-contracts",
  builders: "builders",
  resources: "resources",
};

function transformBody(
  body: string,
  locale: string,
  frontmatter: Record<string, unknown>,
): { body: string; title: string | undefined } {
  let title = frontmatter.title as string | undefined;

  // Derive title from a leading H1 if frontmatter lacks one.
  const lines = body.split("\n");
  // Skip leading blank lines.
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  const h1 = lines[i]?.match(/^#\s+(.+?)\s*#*\s*$/);
  if (h1) {
    const h1text = h1[1].replace(/\*\*/g, "").trim();
    if (!title) title = h1text;
    // Strip the leading H1 (title is rendered by the page template).
    lines.splice(i, 1);
    // Remove a following blank line for tidiness.
    if (lines[i]?.trim() === "") lines.splice(i, 1);
    body = lines.join("\n");
  }

  // Admonitions: :::kind [title]\n … \n:::
  body = body.replace(
    /^:::(\w+)(?:\s+(.+))?\n([\s\S]*?)^:::\s*$/gm,
    (_m, kind: string, ttl: string | undefined, inner: string) => {
      const mapped = ADMONITION_KIND[kind.toLowerCase()] ?? "note";
      const titleAttr = ttl ? ` title="${ttl.trim().replace(/"/g, "&quot;")}"` : "";
      return `<Admonition kind="${mapped}"${titleAttr}>\n\n${inner.trim()}\n\n</Admonition>`;
    },
  );

  // Drop @site component imports (provided via the MDX components map).
  body = body.replace(/^import\s+\w+\s+from\s+['"]@site\/[^'"]+['"];?\s*$/gm, "");

  // HTML comments are invalid in MDX — convert to MDX expression comments.
  body = body.replace(/<!--([\s\S]*?)-->/g, (_m, inner: string) => `{/*${inner}*/}`);

  // Rewrite section-prefixed absolute links and strip .md(x) extensions.
  body = body.replace(/\]\((\/[^)]+|\.\/?[^)]+)\)/g, (full, url: string) => {
    // Leave images and anchors and external alone.
    if (/^https?:|^#|\.(png|jpe?g|svg|gif|webp|pdf)(\)|$|#)/i.test(url)) return full;
    let u = url;
    // Absolute Docusaurus paths: /educ/x, /v1/x, /builders/x, /resources/x
    const abs = u.match(/^\/(educ|v1|builders|resources)(\/.*)?$/);
    if (abs) {
      const section = SECTION_OF_PREFIX[abs[1]];
      u = `/${locale}/${section}${abs[2] ?? ""}`;
    } else if (u.startsWith("./") || u.startsWith("../")) {
      // Relative link within the same section — strip ./ and extension; the
      // doc page resolves by segments so a bare slug works within section.
      u = u.replace(/^\.\//, "").replace(/^\.\.\//, "");
    }
    u = u.replace(/\.mdx?(#|$)/, "$1");
    return `](${u})`;
  });

  return { body: body.trim() + "\n", title };
}

function migrateFile(srcFile: string, destFile: string, locale: string): void {
  const raw = fs.readFileSync(srcFile, "utf8");
  const { data, content } = matter(raw);
  const { body, title } = transformBody(content, locale, data);

  const fm: Record<string, unknown> = {};
  if (title) fm.title = title;
  if (data.description) fm.description = data.description;
  if (data.sidebar_label) fm.sidebar_label = data.sidebar_label;
  if (data.sidebar_position != null) fm.position = data.sidebar_position;

  const out = matter.stringify(body, fm);
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, out);
}

function copyCategory(srcFile: string, destFile: string): void {
  const meta = JSON.parse(fs.readFileSync(srcFile, "utf8"));
  const out: Record<string, unknown> = {};
  if (meta.label) out.label = meta.label;
  if (meta.position != null) out.position = meta.position;
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, JSON.stringify(out, null, 2) + "\n");
}

function walk(srcBase: string, destBase: string, locale: string): number {
  if (!fs.existsSync(srcBase)) {
    console.warn(`  (missing) ${srcBase}`);
    return 0;
  }
  let n = 0;
  for (const entry of fs.readdirSync(srcBase, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const s = path.join(srcBase, entry.name);
    if (entry.isDirectory()) {
      n += walk(s, path.join(destBase, entry.name), locale);
    } else if (/\.mdx?$/.test(entry.name)) {
      const destName = entry.name.replace(/\.md$/, ".mdx");
      migrateFile(s, path.join(destBase, destName), locale);
      n++;
    } else if (entry.name === "_category_.json" || entry.name === "_category.json") {
      copyCategory(s, path.join(destBase, "_category.json"));
    }
  }
  return n;
}

function copyImages(): void {
  const imgSrc = path.join(SRC, "static", "img");
  const imgDest = path.join(DOCS_ROOT, "public", "img");
  if (!fs.existsSync(imgSrc)) return;
  fs.mkdirSync(imgDest, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(imgSrc)) {
    if (f.startsWith(".")) continue;
    fs.copyFileSync(path.join(imgSrc, f), path.join(imgDest, f));
    n++;
  }
  console.log(`images: copied ${n} files → public/img`);
}

let total = 0;
for (const locale of LOCALES) {
  for (const { slug: section } of SECTIONS) {
    const sBase = path.join(SRC, srcDir(locale, section));
    const dBase = path.join(CONTENT, locale, section);
    const n = walk(sBase, dBase, locale);
    total += n;
    console.log(`${locale}/${section}: ${n} docs`);
  }
}
copyImages();
console.log(`\nMigrated ${total} docs across ${LOCALES.length} locales.`);
