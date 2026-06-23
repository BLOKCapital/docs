/**
 * Build-time generator for the llms.txt convention (https://llmstxt.org):
 * Agent Search Optimization for ChatGPT, Claude, Perplexity, Gemini & co.
 *
 * Emits two files into /public (served at the site root):
 *   - llms.txt        a compact, curated map: site summary + every doc grouped
 *                     by section, as Markdown links with one-line descriptions.
 *   - llms-full.txt   the full English corpus as clean Markdown, so an agent
 *                     can ingest the entire documentation in a single fetch.
 *
 * Runs via the predev/prebuild npm hooks so both files track content. Uses the
 * default (en) locale, the canonical content set.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  walkLocale,
  titleFromSlug,
  toPlainText,
  expandMdxForText,
  type Doc,
} from "./_content";
import { SECTION_BLURB } from "../src/lib/config";

const SECTION_BLURB_EN = SECTION_BLURB.en as Record<string, string>;

const SITE_URL = "https://docs.blokcapital.io";
const SITE_NAME = "BLOK Capital Docs";
const SUMMARY =
  "Official documentation for BLOK Capital, a non-custodial, on-chain wealth management protocol on EVM chains. Covers the Diamond (EIP-2535) architecture, account abstraction, Gardens, facets, oracles, the V1 smart-contract system, tokenomics, DAO governance, and builder guides.";

const SECTION_TITLES: Record<string, string> = {
  concepts: "Concepts",
  "smart-contracts": "Smart Contracts",
  builders: "Builders",
  resources: "Resources",
};
const SECTION_ORDER = ["concepts", "smart-contracts", "builders", "resources"];

function firstParagraph(content: string): string {
  const text = toPlainText(content);
  // Accumulate whole sentences (never cut mid-word). Skip leading section
  // numbers ("1.") and short, letter-free fragments.
  const sentences = text.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    const clean = s.trim();
    if (!out && (clean.length < 12 || !/[a-zA-Z]{3,}/.test(clean))) continue;
    const candidate = out ? `${out} ${clean}` : clean;
    if (out && candidate.length > 200) break; // stop at the sentence boundary
    out = candidate;
    if (out.length >= 160) break;
  }
  if (!out) out = text;
  // Single over-long sentence: trim to the last whole word, add an ellipsis.
  if (out.length > 220) out = out.slice(0, 220).replace(/\s+\S*$/, "") + "…";
  return out.trim();
}

function docTitle(doc: Doc): string {
  return (
    (doc.data.title as string | undefined) ??
    titleFromSlug(doc.segments[doc.segments.length - 1] ?? doc.section)
  );
}

function build(): void {
  const docs = walkLocale("en");
  const bySection = new Map<string, Doc[]>(
    SECTION_ORDER.map((s): [string, Doc[]] => [s, []]),
  );
  for (const doc of docs) {
    let bucket = bySection.get(doc.section);
    if (!bucket) {
      bucket = [];
      bySection.set(doc.section, bucket);
    }
    bucket.push(doc);
  }

  // ---- llms.txt (curated index) ----
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SUMMARY}`,
    "",
    "This file helps AI assistants and answer engines discover and cite the BLOK Capital documentation. All pages are also available in Spanish (`/es/`) and French (`/fr/`).",
    "",
  ];

  for (const section of SECTION_ORDER) {
    const items = (bySection.get(section) ?? []).filter(
      (d) => d.segments.length > 1,
    );
    if (!items.length) continue;
    const sectionTitle = SECTION_TITLES[section] ?? titleFromSlug(section);
    lines.push(`## ${sectionTitle}`, "");
    // The section landing page is in the sitemap but has no Markdown twin, so
    // link its HTML URL — keeps llms.txt coverage at 100% (llms-txt-coverage).
    lines.push(
      `- [${sectionTitle} overview](${SITE_URL}/en/${section}): ${SECTION_BLURB_EN[section] ?? ""}`,
    );
    for (const doc of items) {
      const desc =
        (doc.data.description as string | undefined)?.trim() ||
        firstParagraph(doc.content);
      // Link to the Markdown twin so agents fetch clean source, not the HTML
      // shell (satisfies the llms-txt-links-markdown check).
      const url = `${SITE_URL}${doc.href}.md`;
      lines.push(`- [${docTitle(doc)}](${url})${desc ? `: ${desc}` : ""}`);
    }
    lines.push("");
  }

  lines.push(
    "## Optional",
    "",
    `- [Documentation home](${SITE_URL}/en): Start here — overview and the four documentation sections.`,
    `- [Website](https://blokcapital.io): The BLOK Capital product site.`,
    `- [Full documentation corpus](${SITE_URL}/llms-full.txt): Every page concatenated as Markdown.`,
    "",
  );

  fs.writeFileSync(path.join(ROOT, "public", "llms.txt"), lines.join("\n"));

  // ---- llms-full.txt (full corpus) ----
  const full = [`# ${SITE_NAME}: Full Documentation`, "", `> ${SUMMARY}`, ""];
  for (const section of SECTION_ORDER) {
    const items = bySection.get(section) ?? [];
    for (const doc of items) {
      full.push(
        "",
        "---",
        "",
        `# ${docTitle(doc)}`,
        `Source: ${SITE_URL}${doc.href}`,
        `Section: ${SECTION_TITLES[section] ?? titleFromSlug(section)}`,
        "",
        expandMdxForText(doc.content).trim(),
        "",
      );
    }
  }
  fs.writeFileSync(path.join(ROOT, "public", "llms-full.txt"), full.join("\n"));

  console.log(
    `llms.txt: ${docs.length} docs indexed; llms-full.txt corpus written`,
  );
}

build();
