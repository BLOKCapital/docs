/**
 * Content validator — run in CI before build.
 *
 * Errors (exit 1):
 *   - a doc missing a `title` frontmatter
 *   - an internal link `/{locale}/…` that resolves to no page
 *   - LOCALES / SECTIONS drift between this script and src/lib/config.ts
 *
 * Warnings (non-fatal):
 *   - links missing a locale prefix, or relative links
 *   - locale parity gaps (a doc present in some locales but not others)
 *   - duplicate `position` within a folder
 *   - missing `description`
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, LOCALES, SECTIONS, walkLocale } from "./_content.mjs";

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Public asset prefixes that are valid link/image targets (not docs).
const PUBLIC_PREFIXES = ["/img", "/brand", "/textures", "/search", "/favicon"];

/* 1. Guard against config drift with src/lib/config.ts ------------------- */
function checkConfigSync() {
  const cfg = fs.readFileSync(path.join(ROOT, "src/lib/config.ts"), "utf8");
  const locM = cfg.match(/LOCALES\s*=\s*\[([^\]]*)\]/);
  const cfgLocales = locM
    ? [...locM[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const cfgSections = [...cfg.matchAll(/\{\s*slug:\s*"([^"]+)",\s*dir:/g)].map(
    (m) => m[1],
  );
  if (cfgLocales.join(",") !== LOCALES.join(",")) {
    err(
      `config drift: LOCALES in config.ts [${cfgLocales}] ≠ scripts [${LOCALES}]`,
    );
  }
  const scriptSlugs = SECTIONS.map((s) => s.slug);
  if (cfgSections.join(",") !== scriptSlugs.join(",")) {
    err(
      `config drift: SECTIONS in config.ts [${cfgSections}] ≠ scripts [${scriptSlugs}]`,
    );
  }
}

/* 2. Load every doc, keyed by locale ------------------------------------- */
const byLocale = Object.fromEntries(LOCALES.map((l) => [l, walkLocale(l)]));
const allDocs = Object.values(byLocale).flat();

// Valid link targets: any doc href, plus every ancestor path (navigable
// category / section roots).
const validTargets = new Set();
for (const doc of allDocs) {
  for (let i = 1; i <= doc.segments.length; i++) {
    validTargets.add(`/${doc.locale}/${doc.segments.slice(0, i).join("/")}`);
  }
  validTargets.add(`/${doc.locale}`);
}

/* 3. Frontmatter + link checks ------------------------------------------- */
const LINK_RE = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)|href=["']([^"']+)["']/g;

function isPublicAsset(target) {
  return PUBLIC_PREFIXES.some((p) => target === p || target.startsWith(p + "/"));
}

for (const doc of allDocs) {
  if (!doc.data.title) err(`${doc.file}: missing "title" frontmatter`);
  else if (!doc.data.description)
    warn(`${doc.file}: missing "description" frontmatter`);

  for (const m of doc.content.matchAll(LINK_RE)) {
    const raw = (m[1] ?? m[2] ?? "").trim();
    if (!raw) continue;
    const target = raw.split("#")[0].split("?")[0];
    if (!target || target.startsWith("#")) continue; // pure anchor
    if (/^(https?:|mailto:|tel:|\/\/)/.test(target)) continue; // external
    if (isPublicAsset(target)) continue; // image / static asset

    if (target.startsWith("/")) {
      const first = target.split("/")[1];
      if (!LOCALES.includes(first)) {
        warn(`${doc.file}: link "${raw}" is missing a locale prefix`);
        continue;
      }
      if (!validTargets.has(target.replace(/\/$/, ""))) {
        err(`${doc.file}: broken internal link "${raw}"`);
      }
    } else if (!target.startsWith("mailto")) {
      warn(`${doc.file}: relative link "${raw}" (prefer /{locale}/… absolute)`);
    }
  }
}

/* 4. Locale parity ------------------------------------------------------- */
const keyOf = (d) => `${d.section}/${d.segments.join("/")}`;
const perLocaleKeys = Object.fromEntries(
  LOCALES.map((l) => [l, new Set(byLocale[l].map(keyOf))]),
);
const allKeys = new Set(allDocs.map(keyOf));
for (const key of allKeys) {
  const missing = LOCALES.filter((l) => !perLocaleKeys[l].has(key));
  if (missing.length) warn(`parity: "${key}" missing in [${missing.join(", ")}]`);
}

/* 5. Duplicate position within a folder ---------------------------------- */
for (const locale of LOCALES) {
  const folders = {};
  for (const doc of byLocale[locale]) {
    if (doc.data.position == null) continue;
    const folder = doc.segments.slice(0, -1).join("/");
    (folders[folder] ??= []).push({ pos: doc.data.position, file: doc.file });
  }
  for (const [folder, items] of Object.entries(folders)) {
    const seen = new Map();
    for (const it of items) {
      if (seen.has(it.pos))
        warn(
          `duplicate position ${it.pos} in ${locale}/${folder}: ${seen.get(it.pos)} & ${it.file}`,
        );
      else seen.set(it.pos, it.file);
    }
  }
}

/* 6. Report -------------------------------------------------------------- */
checkConfigSync();

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

console.log(
  `\nchecked ${allDocs.length} docs · ${errors.length} error(s), ${warnings.length} warning(s)`,
);

if (errors.length) process.exit(1);
