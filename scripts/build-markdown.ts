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
import {
  ROOT,
  LOCALES,
  walkLocale,
  titleFromSlug,
  expandMdxForText,
  type Doc,
} from "./_content";
import { SITE } from "../src/lib/config";

const PUBLIC = path.join(ROOT, "public");
const GENERATED = path.join(ROOT, "src", "lib", "generated");

function docTitle(doc: Doc): string {
  return (
    (doc.data.title as string | undefined) ??
    titleFromSlug(doc.segments[doc.segments.length - 1] ?? doc.section)
  );
}

/**
 * How each date was resolved. The mtime path is a legitimate fallback for a
 * file that is genuinely untracked, but at scale it means something is wrong —
 * see the warning in `build()`.
 */
const dateSource = { git: 0, mtime: 0 };

/** True for a `--depth`-limited clone; false for full history or no git. */
function isShallowRepo(): boolean {
  try {
    return (
      execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "true"
    );
  } catch {
    return false;
  }
}

/** Last git commit date (ISO 8601) for a file; falls back to filesystem mtime. */
function lastUpdated(relFile: string): string {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relFile],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (out) {
      dateSource.git++;
      return out;
    }
  } catch {
    /* git unavailable or file untracked — fall through to mtime */
  }
  try {
    const iso = fs.statSync(path.join(ROOT, relFile)).mtime.toISOString();
    dateSource.mtime++;
    return iso;
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
  // Agent discovery directive (AFDocs `llms-txt-directive-md`): a blockquote
  // near the top of every Markdown page pointing back to the documentation
  // index, so a crawler that lands on one `.md` twin can find the rest.
  parts.push(
    `> Markdown version of ${canonical}. The full BLOK Capital documentation index is at ${SITE.url}/llms.txt.`,
    "",
  );
  // The leading H1 was stripped at migration (the page template renders the
  // title), so prepend it above; the body keeps its H2/H3 hierarchy intact.
  // Content-bearing components (<Chart/>, <Admonition>) are expanded to text so
  // the twin matches the rendered HTML (markdown-content-parity).
  parts.push(expandMdxForText(doc.content).trim(), "", "---", "");
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

  // Drop twins whose source doc no longer exists.
  //
  // This generator only ever wrote files, so a retired page kept serving its
  // stale Markdown at `<href>.md` indefinitely. That is worse than it sounds:
  // `builders/smart-contracts/*` was deleted precisely because its content was
  // wrong, and while those URLs now 308-redirect in HTML, the orphaned twins
  // would still hand an AI agent the retired copy at a 200.
  const live = new Set(
    routes.map((href) => path.join(PUBLIC, `${href.replace(/^\//, "")}.md`)),
  );
  let pruned = 0;
  for (const locale of LOCALES) {
    const root = path.join(PUBLIC, locale);
    if (!fs.existsSync(root)) continue;
    const dirs: string[] = [];
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop() as string;
      dirs.push(dir);
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.endsWith(".md") && !live.has(full)) {
          fs.rmSync(full);
          pruned++;
        }
      }
    }
    // Remove directories the prune left empty, deepest first.
    for (const dir of dirs.sort((a, b) => b.length - a.length)) {
      if (dir !== root && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
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
    `markdown: ${count} .md twins across ${LOCALES.length} locales; ${routes.length} routes indexed` +
      (pruned ? `; ${pruned} stale twin(s) pruned` : ""),
  );

  // "Last updated" is only meaningful with full history, and both ways of
  // losing it are silent by default:
  //
  //  - Shallow clone (the default for actions/checkout and most deploy hosts).
  //    The single grafted commit has no parent, so git reports it as having
  //    created *every* file — `git log` returns a date for all of them, and it
  //    is the same wrong date. This is why counting mtime fallbacks does not
  //    detect it; ask git directly instead.
  //  - No git at all (a source tarball), where everything falls to mtime.
  //
  // A wrong freshness date is worse than none, so both cases say so loudly.
  if (isShallowRepo()) {
    console.warn(
      `[markdown] WARNING: shallow git clone — every page will show the same\n` +
        `           "Last updated" date, not when it actually changed.\n` +
        `           Fetch full history (actions/checkout: \`fetch-depth: 0\`,\n` +
        `           or the deploy host's equivalent setting).`,
    );
  } else if (dateSource.mtime) {
    const total = dateSource.git + dateSource.mtime;
    console.warn(
      `[markdown] WARNING: ${dateSource.mtime}/${total} "Last updated" dates came from file\n` +
        `           mtime because git history was unavailable for those files.`,
    );
  }
}

build();
