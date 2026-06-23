/**
 * Search tokenization shared by the client index and the result presentation.
 *
 * A custom FlexSearch `encode` function (rather than its 0.7 language packs,
 * which lack es/fr and import awkwardly) gives us deterministic, version-proof
 * control over how both documents and queries are tokenized:
 *
 *   - diacritic folding        oráculo ↔ oraculo, décentralisé ↔ decentralise
 *   - camelCase / dotted split  diamondCut → {diamondcut, diamond, cut};
 *                               IIndex.sol → {iindexsol, iindex, sol}
 *   - stopword removal          per-locale function words
 *   - light English stemming    rebalancing ↔ rebalance, facets ↔ facet
 *
 * The SAME encoder runs over the query, so matching is symmetric. Forward
 * tokenization on top still gives prefix matches (garden → gardens).
 */
import type { Locale } from "@/lib/config";

const STOPWORDS: Record<Locale, Set<string>> = {
  en: new Set(["the", "a", "an", "of", "to", "and", "or", "is", "are", "be", "for", "in", "on", "with", "as", "at", "by", "it", "this", "that", "from", "into", "your", "you", "we", "our", "not"]),
  es: new Set(["el", "la", "los", "las", "un", "una", "de", "del", "y", "o", "es", "son", "para", "en", "con", "por", "que", "se", "su", "como", "al", "lo", "una"]),
  fr: new Set(["le", "la", "les", "un", "une", "de", "des", "du", "et", "ou", "est", "sont", "pour", "en", "avec", "par", "que", "se", "sa", "son", "comme", "au", "aux", "dans", "ce", "cette"]),
};

/** Lowercase + strip diacritics; drop anything non-alphanumeric. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Same-length lowercase de-accented copy (one output char per input char) so
 * match positions found in the folded string map 1:1 back onto the original —
 * used by snippet/highlight to mark accented matches without index drift.
 */
export function foldKeepLen(s: string): string {
  let out = "";
  for (const ch of s) {
    const base = ch.normalize("NFD")[0] ?? ch;
    out += base.toLowerCase();
  }
  return out;
}

/** Crude but symmetric English suffix stripper. */
function stemEn(w: string): string {
  return w
    .replace(/(ization|isation)$/, "ize")
    .replace(/(ing|edly|ed|ly|ies|es|s)$/, "")
    .replace(/(.)\1$/, "$1");
}

/** Split an original token into its camelCase / dotted / snake subwords. */
function subwords(tok: string): string[] {
  return tok.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[._/-]+|\s+/);
}

/**
 * Build a FlexSearch encoder for a locale: returns the token list for a string.
 * Keeps the full joined token (so `diamondcut` typed whole still hits) plus its
 * subwords, each optionally stemmed (English only — es/fr rely on folding +
 * forward prefix matching to avoid mis-stemming).
 */
export function makeEncoder(locale: Locale): (str: string) => string[] {
  const stop = STOPWORDS[locale];
  const stem = locale === "en" ? stemEn : (w: string) => w;
  return (str: string): string[] => {
    const raw = String(str).split(/[^\p{L}\p{N}._/-]+/u).filter(Boolean);
    const out = new Set<string>();
    const push = (tok: string) => {
      const f = fold(tok);
      if (f.length < 2 || stop.has(f)) return;
      out.add(f);
      const s = stem(f);
      if (s.length >= 2 && s !== f) out.add(s);
    };
    for (const tok of raw) {
      push(tok);
      const subs = subwords(tok);
      if (subs.length > 1) for (const sub of subs) push(sub);
    }
    return [...out];
  };
}

/** Distinct folded query terms (length ≥ 2) for presentation/highlighting. */
export function queryTerms(q: string): string[] {
  return Array.from(
    new Set(
      q
        .split(/[^\p{L}\p{N}]+/u)
        .map((t) => fold(t))
        .filter((t) => t.length >= 2),
    ),
  );
}
