/**
 * Domain synonym / acronym expansion for search retrieval.
 *
 * Each group lists equivalent terms (acronym ↔ expansion, cross-locale). When a
 * query mentions any member, the others are searched too and results are unioned
 * — so "AA" finds "Account Abstraction" pages and vice-versa. Members are matched
 * diacritic- and case-insensitively; expansions that don't exist in a given
 * locale's index simply return nothing, so cross-locale members are harmless.
 */
import { fold } from "@/lib/search-text";

const GROUPS: string[][] = [
  ["aa", "account abstraction", "abstracción de cuentas", "abstraction de comptes"],
  ["don", "decentralised oracle network", "decentralized oracle network", "oracle network", "red de oráculos", "réseau d'oracles"],
  ["swa", "smart wallet account", "smart wallet"],
  ["cre", "chainlink runtime environment"],
  ["sbt", "soulbound token", "soulbound", "pass"],
  ["dao", "governance", "gobernanza", "gouvernance", "aragon"],
  ["eip-2535", "diamond", "diamond proxy", "diamond pattern"],
  ["blokc", "blok capital token", "blok token"],
  ["index garden", "index gardens", "garden index"],
];

/** Fold each word and rejoin space-separated, for phrase-level matching. */
function foldWords(s: string): string {
  return s
    .split(/[^\p{L}\p{N}]+/u)
    .map(fold)
    .filter(Boolean)
    .join(" ");
}

// Precompute folded member forms once.
const FOLDED = GROUPS.map((g) => g.map((m) => ({ raw: m, norm: foldWords(m) })));

/**
 * Given a raw query, return the original plus up to a handful of expansion
 * queries drawn from any synonym group the query touches.
 */
export function expandQuery(query: string): string[] {
  const qNorm = ` ${foldWords(query)} `;
  const variants = new Set<string>([query]);
  for (const group of FOLDED) {
    const hit = group.some((m) => m.norm && qNorm.includes(` ${m.norm} `));
    if (!hit) continue;
    for (const m of group) {
      if (variants.size >= 8) break;
      variants.add(m.raw);
    }
  }
  return [...variants];
}
