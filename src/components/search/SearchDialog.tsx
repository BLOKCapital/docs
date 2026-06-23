"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import FlexSearch from "flexsearch";
import { UI, type Locale, type SectionSlug } from "@/lib/config";
import { cn } from "@/lib/utils";
import { makeEncoder, queryTerms, foldKeepLen } from "@/lib/search-text";
import { expandQuery } from "@/lib/search-synonyms";

type Heading = { text: string; slug: string };

type Record = {
  id: number;
  href: string;
  title: string;
  section: SectionSlug;
  description: string;
  headings: Heading[];
  symbols: string[];
  text: string;
};

/** An enriched result: the record plus query-aware presentation data. */
type Hit = {
  record: Record;
  /** Navigation target — deep-links to the matched section when relevant. */
  href: string;
  /** The heading that matched, shown as context (null when the title matched). */
  heading: Heading | null;
  /** Best contextual snippet around the first match. */
  snippet: string;
  terms: string[];
};

// --- query helpers ---------------------------------------------------------
// `terms` are folded (diacritic-stripped, lowercased — see search-text). We
// match them against a same-length folded copy of each string so accented or
// cased text still matches, then render slices of the ORIGINAL text by position.

/** Merged [start, end) ranges where any folded term occurs in `text`. */
function matchRanges(text: string, terms: string[]): Array<[number, number]> {
  if (!terms.length || !text) return [];
  const f = foldKeepLen(text);
  const ranges: Array<[number, number]> = [];
  for (const t of terms) {
    for (let i = f.indexOf(t); i !== -1; i = f.indexOf(t, i + t.length)) {
      ranges.push([i, i + t.length]);
    }
  }
  if (!ranges.length) return [];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [ranges[0]];
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

/** Wrap each folded-term occurrence in <mark>, rendering the original text. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const ranges = matchRanges(text, terms);
  if (!ranges.length) return <>{text}</>;
  const out: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], i) => {
    if (s > cursor) out.push(<span key={`t${i}`}>{text.slice(cursor, s)}</span>);
    out.push(
      <mark key={`m${i}`} className="rounded-[3px] bg-ochre/30 px-px text-ink">
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  });
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{out}</>;
}

/** Earliest folded-term position in `text`, or -1. */
function firstMatch(text: string, terms: string[]): number {
  const f = foldKeepLen(text);
  let pos = -1;
  for (const t of terms) {
    const i = f.indexOf(t);
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  }
  return pos;
}

/** A snippet windowed around the earliest matching term. */
function snippet(text: string, terms: string[], len = 180): string {
  if (!text) return "";
  const pos = firstMatch(text, terms);
  if (pos === -1) return text.slice(0, len).trimEnd();

  const start = Math.max(0, pos - 70);
  let s = text.slice(start, start + len);
  if (start > 0) s = `…${s.replace(/^\S+\s/, "")}`; // drop partial leading word
  if (start + len < text.length) s = `${s.replace(/\s\S+$/, "")}…`;
  return s.trim();
}

/** First heading whose text contains a query term. */
function bestHeading(headings: Heading[], terms: string[]): Heading | null {
  return headings.find((h) => firstMatch(h.text, terms) !== -1) ?? null;
}

/**
 * Pick the snippet for a result. When we deep-link to a matched heading, anchor
 * the snippet to that section's prose so the preview matches where the link
 * goes; otherwise window around the first body match, falling back to the
 * description.
 */
function buildSnippet(record: Record, terms: string[], heading: Heading | null): string {
  if (heading) {
    const hi = foldKeepLen(record.text).indexOf(foldKeepLen(heading.text));
    if (hi !== -1) {
      const after = record.text.slice(hi + heading.text.length).trimStart();
      const s = snippet(after, terms);
      if (s) return s;
    }
  }
  if (firstMatch(record.text, terms) !== -1) {
    return snippet(record.text, terms);
  }
  return record.description || `${record.text.slice(0, 160).trimEnd()}…`;
}

/**
 * Re-rank FlexSearch's id list so title matches lead, then heading matches,
 * keeping the engine's relevance order as the tiebreaker (stable sort).
 */
function rank(records: Map<number, Record>, ids: number[], terms: string[]): Record[] {
  return ids
    .map((id, order) => {
      const r = records.get(id);
      if (!r) return null;
      let score = 0;
      if (firstMatch(r.title, terms) !== -1) score += 3;
      if (r.headings.some((h) => firstMatch(h.text, terms) !== -1)) score += 2;
      return { r, score, order };
    })
    .filter((x): x is { r: Record; score: number; order: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((x) => x.r);
}

/** Modal search over the prebuilt per-locale index, powered by FlexSearch. */
export function SearchDialog({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const router = useRouter();
  const t = UI[locale];
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<Record[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef<FlexSearch.Index | null>(null);

  // Load the locale index once and build the FlexSearch index. Title and
  // headings are weighted by repetition so they rank above body prose.
  useEffect(() => {
    let cancelled = false;
    fetch(`/search/${locale}.json`)
      .then((r) => r.json())
      .then((data: Record[]) => {
        if (cancelled) return;
        const idx = new FlexSearch.Index({
          tokenize: "forward",
          encode: makeEncoder(locale),
          cache: true,
        });
        for (const rec of data) {
          const headings = rec.headings.map((h) => h.text).join(" ");
          const symbols = rec.symbols.join(" ");
          idx.add(
            rec.id,
            `${rec.title} ${rec.title} ${rec.description} ${headings} ${headings} ${rec.text} ${symbols}`,
          );
        }
        indexRef.current = idx;
        setRecords(data);
      })
      .catch(() => setRecords([]));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const results = useMemo<Hit[]>(() => {
    if (!query.trim() || !indexRef.current) return [];
    // Expand the query through domain synonyms, search each variant, and union
    // the ids (dedup, first-seen order). Highlight/snippet use the folded terms
    // of the original query *and* its expansions so synonym hits show context.
    const variants = expandQuery(query);
    const terms = Array.from(new Set(variants.flatMap(queryTerms)));
    if (!terms.length) return [];
    const seen = new Set<number>();
    const ids: number[] = [];
    for (const v of variants) {
      const part = indexRef.current.search(v, { limit: 12, suggest: true }) as number[];
      for (const id of part) {
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
      if (ids.length >= 30) break;
    }
    const byId = new Map(records.map((r) => [r.id, r]));
    return rank(byId, ids, terms).slice(0, 12).map((record) => {
      const titleHit = firstMatch(record.title, terms) !== -1;
      const heading = titleHit ? null : bestHeading(record.headings, terms);
      return {
        record,
        terms,
        heading,
        href: heading ? `${record.href}#${heading.slug}` : record.href,
        snippet: buildSnippet(record, terms, heading),
      };
    });
  }, [query, records]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted result scrolled into view during keyboard nav.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].href);
    }
  }

  // The navbar header uses `backdrop-blur`, which makes it the containing block
  // for any `position: fixed` descendant. Portal to <body> so the overlay is
  // sized to the viewport instead of the header.
  if (typeof document === "undefined") return null;

  const hasQuery = query.trim().length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t.search}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-[0_30px_60px_-24px_rgba(31,26,20,0.4)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-ink/10 px-4">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0 text-ink-subtle">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-subtle"
            aria-label={t.search}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-ink/15 bg-paper-warm px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle">
            esc
          </kbd>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {hasQuery && results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-ink-subtle">
              {t.noResults}
            </p>
          )}
          <ul id="search-results" role="listbox">
            {results.map((hit, i) => (
              <li key={hit.href} role="option" aria-selected={i === active}>
                <button
                  ref={i === active ? activeRef : undefined}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(hit.href)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                    i === active ? "bg-moss/[0.1]" : "hover:bg-paper-deep/50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-clay">
                    {t.sections[hit.record.section]}
                    {hit.heading && (
                      <>
                        <Chevron />
                        <span className="truncate normal-case tracking-normal text-ink-subtle">
                          <Highlight text={hit.heading.text} terms={hit.terms} />
                        </span>
                      </>
                    )}
                  </span>
                  <span className="text-[14.5px] font-medium leading-snug text-ink">
                    <Highlight text={hit.record.title} terms={hit.terms} />
                  </span>
                  {hit.snippet && (
                    <span className="line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
                      <Highlight text={hit.snippet} terms={hit.terms} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {results.length > 0 && (
          <div className="flex items-center gap-4 border-t border-ink/10 px-4 py-2 text-[11px] text-ink-subtle">
            <Hint keys={["↑", "↓"]} label="navigate" />
            <Hint keys={["↵"]} label="open" />
            <Hint keys={["esc"]} label="close" />
            <span className="ml-auto tabular-nums">
              {results.length} {results.length === 1 ? "result" : "results"}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Chevron() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className="shrink-0 text-ink/30">
      <path d="M3.5 2 L6.5 5 L3.5 8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }): ReactNode {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="rounded border border-ink/15 bg-paper-warm px-1.5 py-0.5 font-mono text-[10px]"
        >
          {k}
        </kbd>
      ))}
      {label}
    </span>
  );
}
