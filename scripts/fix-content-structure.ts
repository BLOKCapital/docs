/**
 * One-off content migration, safe to re-run (idempotent).
 *
 * 1. De-duplicates the lede. The page template renders `frontmatter.description`
 *    under the H1, and on ~a third of pages the body opened by repeating that
 *    same sentence verbatim — so the identical text rendered twice, back to
 *    back. Where the body paragraph merely *starts* with the description and
 *    then continues, only the duplicated prefix is removed.
 *
 * 2. Normalises heading depth. Ten pages started at `###`, skipping `##`
 *    entirely: a WCAG 1.3.1 heading-order violation, and it also meant the TOC
 *    rendered every entry at depth 3 (uniformly indented, no hierarchy) and the
 *    pages lost the `h2` border-rule that creates section rhythm. When a file's
 *    shallowest heading is `###`, every heading in it is promoted one level.
 *
 * Usage: tsx scripts/fix-content-structure.ts [--write]
 */
import fs from "node:fs";
import path from "node:path";

const CONTENT = path.join(process.cwd(), "content");
const WRITE = process.argv.includes("--write");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

/** Strip markdown emphasis so a bolded lede still matches a plain description. */
function plain(s: string): string {
  return s
    .replace(/\*\*/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fenced code blocks must be skipped when rewriting headings. */
function promoteHeadings(body: string): { body: string; changed: boolean } {
  const lines = body.split("\n");
  let inFence = false;
  let min = 7;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+\S/.exec(line);
    if (m) min = Math.min(min, m[1].length);
  }
  if (min !== 3) return { body, changed: false };

  inFence = false;
  const out = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return line.replace(/^(#{2,6})(\s+\S)/, (_, hashes: string, rest: string) =>
      "#".repeat(hashes.length - 1) + rest,
    );
  });
  return { body: out.join("\n"), changed: true };
}

function dedupeLede(
  body: string,
  description: string,
): { body: string; changed: boolean } {
  if (!description) return { body, changed: false };
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i >= lines.length) return { body, changed: false };

  const first = lines[i];
  // Only touch a plain paragraph — never a heading, list, quote or fence.
  if (/^\s*(#|[-*+>]|\d+\.|```|~~~|<|:::)/.test(first)) {
    return { body, changed: false };
  }

  const desc = plain(description);
  const flat = plain(first);
  if (!desc || !flat.toLowerCase().startsWith(desc.toLowerCase())) {
    return { body, changed: false };
  }

  const remainder = flat.slice(desc.length).replace(/^[\s.,;:—–-]+/, "").trim();
  if (remainder) {
    lines[i] = remainder;
  } else {
    lines.splice(i, 1);
    while (i < lines.length && !lines[i].trim()) lines.splice(i, 1);
  }
  return { body: lines.join("\n"), changed: true };
}

function run() {
  const files = walk(CONTENT).sort();
  let deduped = 0;
  let promoted = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    if (!m) continue;
    const [, frontmatter, original] = m;

    const descMatch = /^description:\s*(.*)$/m.exec(frontmatter);
    let description = descMatch?.[1]?.trim() ?? "";
    if (
      (description.startsWith("'") && description.endsWith("'")) ||
      (description.startsWith('"') && description.endsWith('"'))
    ) {
      description = description.slice(1, -1);
    }

    let body = original;
    const rel = path.relative(CONTENT, file);

    const d = dedupeLede(body, description);
    if (d.changed) {
      body = d.body;
      deduped++;
      console.log(`  lede    ${rel}`);
    }

    const p = promoteHeadings(body);
    if (p.changed) {
      body = p.body;
      promoted++;
      console.log(`  heading ${rel}`);
    }

    if (body !== original && WRITE) {
      fs.writeFileSync(file, `---\n${frontmatter}\n---\n${body}`);
    }
  }

  console.log(
    `\n${WRITE ? "rewrote" : "would rewrite"}: ${deduped} duplicated ledes, ${promoted} heading trees (of ${files.length} files)`,
  );
  if (!WRITE) console.log("dry run — pass --write to apply");
}

run();
