/**
 * Build-time generator for agent-facing Markdown endpoints (AFDocs / Agent Score).
 *
 * For every doc it emits a clean Markdown twin at public/<locale>/<segments>.md,
 * served at the page URL with a `.md` suffix (e.g. /en/concepts/diamond.md). This
 * hands AI agents the raw source instead of a rendered HTML+JS shell, satisfying
 * the spec's markdown-url-support, llms-txt-links-markdown, page-size-markdown and
 * rendering-strategy checks. `src/middleware.ts` reuses the same files to answer
 * `Accept: text/markdown` content negotiation at the canonical URL.
 *
 * It also writes:
 *   - src/lib/generated/markdown-routes.json  page paths that have a .md twin,
 *     imported by the edge middleware to gate content negotiation
 *   - public/last-updated.json                href → last-commit ISO date, read
 *     by the content loader to render "Last updated" and to stamp each .md footer
 *
 * Runs via the predev/prebuild hooks. The .md twins and last-updated.json are
 * build output (gitignored); markdown-routes.json is committed so `tsc` and the
 * middleware bundle resolve it without requiring a prior build.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, LOCALES, walkLocale, titleFromSlug, type Doc } from "./_content";
import { SITE } from "../src/lib/config";

const PUBLIC = path.join(ROOT, "public");
const GENERATED = path.join(ROOT, "src", "lib", "generated");

function docTitle(doc: Doc): string {
  return (
    (doc.data.title as string | undefined) ??
    titleFromSlug(doc.segments[doc.segments.length - 1] ?? doc.section)
  );
}

/** Last git commit date (ISO 8601) for a file; falls back to filesystem mtime. */
function lastUpdated(relFile: string): string {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relFile],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (out) return out;
  } catch {
    /* git unavailable or file untracked — fall through to mtime */
  }
  try {
    return fs.statSync(path.join(ROOT, relFile)).mtime.toISOString();
  } catch {
    return "";
  }
}

/** Render one doc as a standalone Markdown document for agent consumption. */
function toMarkdown(doc: Doc, updated: string): string {
  const description = (doc.data.description as string | undefined)?.trim();
  const canonical = `${SITE.url}${doc.href}`;
  const parts = [`# ${docTitle(doc)}`, ""];
  if (description) parts.push(description, "");
  // The leading H1 was stripped at migration (the page template renders the
  // title), so prepend it above; the body keeps its H2/H3 hierarchy intact.
  parts.push(doc.content.trim(), "", "---", "");
  const stamp = updated ? `Last updated: ${updated.slice(0, 10)}. ` : "";
  parts.push(
    `_${stamp}Canonical: ${canonical} · Docs index: ${SITE.url}/llms.txt_`,
    "",
  );
  return parts.join("\n");
}

function build(): void {
  const routes: string[] = [];
  const updatedMap: Record<string, string> = {};
  let count = 0;

  for (const locale of LOCALES) {
    for (const doc of walkLocale(locale)) {
      const updated = lastUpdated(doc.file);
      if (updated) updatedMap[doc.href] = updated;

      // /en/concepts/diamond  ->  public/en/concepts/diamond.md  (served at <href>.md)
      const outFile = path.join(PUBLIC, `${doc.href.replace(/^\//, "")}.md`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, toMarkdown(doc, updated));
      routes.push(doc.href);
      count++;
    }
  }

  routes.sort();
  fs.mkdirSync(GENERATED, { recursive: true });
  fs.writeFileSync(
    path.join(GENERATED, "markdown-routes.json"),
    JSON.stringify(routes, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(PUBLIC, "last-updated.json"),
    JSON.stringify(updatedMap, null, 2) + "\n",
  );

  console.log(
    `markdown: ${count} .md twins across ${LOCALES.length} locales; ${routes.length} routes indexed`,
  );
}

build();
