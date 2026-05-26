import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  LOCALES,
  SECTIONS,
  type Locale,
  type SectionSlug,
} from "@/lib/config";

/** Absolute path to the content root (content/<locale>/<section>/…). */
const CONTENT_ROOT = path.join(process.cwd(), "content");

export type DocFrontmatter = {
  title: string;
  description?: string;
  sidebar_label?: string;
  position?: number;
  slug?: string;
};

export type Doc = {
  /** URL path segments after the locale, e.g. ["concepts", "diamond"]. */
  segments: string[];
  /** Full route, e.g. "/en/concepts/diamond". */
  href: string;
  locale: Locale;
  section: SectionSlug;
  frontmatter: DocFrontmatter;
  /** Raw MDX body (frontmatter stripped). */
  body: string;
  /** Absolute file path. */
  filePath: string;
};

export type NavNode =
  | { type: "doc"; label: string; href: string; position: number; segments: string[] }
  | {
      type: "category";
      label: string;
      position: number;
      href?: string;
      items: NavNode[];
    };

type CategoryMeta = { label?: string; position?: number; link?: { slug?: string } };

function readCategoryMeta(dir: string): CategoryMeta {
  // Support both the Docusaurus-style _category_.json and a simpler _category.json.
  for (const name of ["_category.json", "_category_.json"]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf8")) as CategoryMeta;
      } catch {
        return {};
      }
    }
  }
  return {};
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isContentFile(name: string): boolean {
  return /\.mdx?$/.test(name);
}

/** Strip the file extension; "index" files collapse to the folder. */
function slugFromFilename(name: string): string {
  return name.replace(/\.mdx?$/, "");
}

/** Read & parse a single content file into a Doc. */
function readDoc(
  filePath: string,
  locale: Locale,
  section: SectionSlug,
  segments: string[],
): Doc {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as DocFrontmatter;
  const title =
    fm.title ?? titleFromSlug(segments[segments.length - 1] ?? section);
  return {
    segments,
    href: `/${locale}/${segments.join("/")}`,
    locale,
    section,
    frontmatter: { ...fm, title },
    body: content,
    filePath,
  };
}

/** Recursively collect all docs under a section directory. */
function walkSection(
  dir: string,
  locale: Locale,
  section: SectionSlug,
  parentSegments: string[],
  out: Doc[],
): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkSection(full, locale, section, [...parentSegments, entry.name], out);
    } else if (isContentFile(entry.name)) {
      const base = slugFromFilename(entry.name);
      // index files represent their parent folder's landing page.
      const segments =
        base === "index"
          ? parentSegments
          : [...parentSegments, base];
      out.push(readDoc(full, locale, section, segments));
    }
  }
}

/** All docs for a locale across every section. */
export function getAllDocs(locale: Locale): Doc[] {
  const out: Doc[] = [];
  for (const { slug, dir } of SECTIONS) {
    const base = path.join(CONTENT_ROOT, locale, dir);
    walkSection(base, locale, slug, [slug], out);
  }
  return out;
}

/** Look up one doc by its URL segments (after the locale). */
export function getDoc(locale: Locale, segments: string[]): Doc | null {
  const docs = getAllDocs(locale);
  const target = segments.join("/");
  return docs.find((d) => d.segments.join("/") === target) ?? null;
}

/** Every (locale, segments) pair — drives generateStaticParams. */
export function getAllDocParams(): { locale: Locale; slug: string[] }[] {
  const params: { locale: Locale; slug: string[] }[] = [];
  for (const locale of LOCALES) {
    for (const doc of getAllDocs(locale)) {
      params.push({ locale, slug: doc.segments });
    }
  }
  return params;
}

/**
 * Build the ordered navigation tree for one section, mirroring the folder
 * hierarchy. Ordering: frontmatter/category `position` ascending, then label.
 */
export function getSectionNav(locale: Locale, section: SectionSlug): NavNode[] {
  const sectionDef = SECTIONS.find((s) => s.slug === section);
  if (!sectionDef) return [];
  const root = path.join(CONTENT_ROOT, locale, sectionDef.dir);
  return buildTree(root, locale, section, [section]);
}

function buildTree(
  dir: string,
  locale: Locale,
  section: SectionSlug,
  parentSegments: string[],
): NavNode[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: NavNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const meta = readCategoryMeta(full);
      const items = buildTree(full, locale, section, [
        ...parentSegments,
        entry.name,
      ]);
      // Does this folder have an index page (landing)?
      const indexHref = items.length
        ? undefined
        : `/${locale}/${[...parentSegments, entry.name].join("/")}`;
      nodes.push({
        type: "category",
        label: meta.label ?? titleFromSlug(entry.name),
        position: meta.position ?? 999,
        href: indexHref,
        items,
      });
    } else if (isContentFile(entry.name)) {
      const base = slugFromFilename(entry.name);
      if (base === "index") {
        // Folder landing page — handled by the category node above; skip here
        // unless it's a section-root index (parentSegments has length 1).
        continue;
      }
      const raw = fs.readFileSync(full, "utf8");
      const { data } = matter(raw);
      const fm = data as DocFrontmatter;
      const segments = [...parentSegments, base];
      nodes.push({
        type: "doc",
        label: fm.sidebar_label ?? fm.title ?? titleFromSlug(base),
        href: `/${locale}/${segments.join("/")}`,
        position: fm.position ?? 999,
        segments,
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.label.localeCompare(b.label);
  });
}

/** Flatten a nav tree into ordered doc links (for prev/next). */
export function flattenNav(nodes: NavNode[]): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  for (const node of nodes) {
    if (node.type === "doc") {
      out.push({ label: node.label, href: node.href });
    } else {
      if (node.href) out.push({ label: node.label, href: node.href });
      out.push(...flattenNav(node.items));
    }
  }
  return out;
}
