/**
 * Regenerate the `description` frontmatter for every content page from a clean
 * extraction of its body — the seeded drafts leaked raw markdown (tables,
 * `---`, mid-word truncation) into the on-page lead, meta tags and llms.txt.
 *
 * Strips code/JSX/images/links/headings/tables/rules, takes the first real
 * prose paragraph (one or two whole sentences, ≤ ~200 chars), and falls back to
 * a "·"-joined H2 topic list for pages that are almost entirely tables.
 *
 *   npx tsx scripts/regen-descriptions.ts          # dry run — prints results
 *   npx tsx scripts/regen-descriptions.ts --write   # rewrite the .mdx files
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { ROOT, LOCALES, walkLocale } from "./_content";

const WRITE = process.argv.includes("--write");
const MAX = 200;

function clean(body: string): { paras: string[]; headings: string[] } {
  let t = body
    .replace(/```[\s\S]*?```/g, "\n") // fenced code
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/^import .*$/gm, "") // mdx imports
    .replace(/<[^>]+>/g, " ") // jsx/html
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/\*+/g, "") // bold/italic markers
    .replace(/(?<=\s)_([^_\n]+)_(?=\s|$)/g, "$1"); // underscore italics

  const headings: string[] = [];
  const kept: string[] = [];
  for (const ln of t.split("\n")) {
    const s = ln.trim();
    const h = s.match(/^#{2,3}\s+(.+?)\s*#*$/);
    if (h) {
      headings.push(h[1].replace(/[*_`]/g, "").trim());
      kept.push("");
      continue;
    }
    if (/^#{1,6}\s/.test(s)) { kept.push(""); continue; } // other headings
    if (/^[-*_]{3,}$/.test(s)) { kept.push(""); continue; } // horizontal rule
    if (/^:::/.test(s)) { kept.push(""); continue; } // admonition fence
    if (s.includes("|")) { kept.push(""); continue; } // table row
    if (/^[|:\-\s]+$/.test(s)) { kept.push(""); continue; } // table separator
    kept.push(ln);
  }
  t = kept.join("\n").replace(/^\s*[>*\-+]\s+/gm, ""); // drop list/quote markers
  const paras = t
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return { paras, headings };
}

/** Drop leading list/definition punctuation left over after stripping. */
function tidy(s: string): string {
  return s
    .replace(/\s*:\s*:\s*/g, ": ") // "X: : Y" (label + code-stripped list) → "X: Y"
    .replace(/([.!?])\s*:\s*/g, "$1 ") // ". : Y" → ". Y"
    .replace(/^[\s:;,.—–\-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentences(p: string): string {
  let out = "";
  for (const raw of p.split(/(?<=[.!?])\s+/)) {
    const s = raw.trim();
    if (!out && (s.length < 12 || !/[a-zA-ZÀ-ÿ]{3,}/.test(s))) continue;
    const cand = out ? `${out} ${s}` : s;
    if (out && cand.length > MAX) break;
    out = cand;
    if (out.length >= 150) break;
  }
  if (!out) out = p;
  out = tidy(out);
  if (out.length > MAX + 20) out = out.slice(0, MAX).replace(/\s+\S*$/, "") + "…";
  return out.trim();
}

/** True when a paragraph is mostly letters (not a flattened table/number row). */
function isProse(p: string): boolean {
  if (p.length < 40) return false;
  const letters = (p.match(/[a-zA-ZÀ-ÿ]/g)?.length ?? 0);
  return letters > p.length * 0.5;
}

function describe(body: string): { desc: string; fallback: boolean } {
  const { paras, headings } = clean(body);
  const prose = paras.find(isProse);
  if (prose) return { desc: sentences(prose), fallback: false };
  if (headings.length) {
    let list = headings.slice(0, 5).join(" · ");
    if (list.length > MAX) list = list.slice(0, MAX).replace(/\s+\S*$/, "") + "…";
    return { desc: list, fallback: true };
  }
  return { desc: paras[0] ? sentences(paras[0]) : "", fallback: true };
}

let wrote = 0;
const kept: string[] = [];
const samples: string[] = [];
for (const locale of LOCALES) {
  for (const doc of walkLocale(locale)) {
    const { desc } = describe(doc.content);
    // Only replace when extraction is solid; otherwise keep the existing
    // (hand-seeded) description — some component-heavy pages have no prose.
    if (desc.length < 30) {
      kept.push(doc.href);
      continue;
    }
    if (WRITE) {
      const file = path.join(ROOT, doc.file);
      const parsed = matter(fs.readFileSync(file, "utf8"));
      parsed.data.description = desc;
      fs.writeFileSync(file, matter.stringify(parsed.content, parsed.data, { lineWidth: -1 } as never));
    }
    if (locale === "en" && samples.length < 14) samples.push(`${doc.href} → ${desc}`);
    wrote++;
  }
}

console.log(`${WRITE ? "rewrote" : "would rewrite"} ${wrote}; kept existing on ${kept.length}`);
console.log("\nsample (en):");
for (const s of samples) console.log("  " + s);
if (kept.length) console.log("\nkept existing (no clean prose):\n  " + kept.join("\n  "));
