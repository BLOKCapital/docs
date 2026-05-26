"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import FlexSearch from "flexsearch";
import { UI, type Locale, type SectionSlug } from "@/lib/config";
import { cn } from "@/lib/utils";

type Record = {
  id: number;
  href: string;
  title: string;
  section: SectionSlug;
  description: string;
  headings: string[];
  text: string;
};

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
  const indexRef = useRef<FlexSearch.Index | null>(null);

  // Load the locale index once and build the FlexSearch document index.
  useEffect(() => {
    let cancelled = false;
    fetch(`/search/${locale}.json`)
      .then((r) => r.json())
      .then((data: Record[]) => {
        if (cancelled) return;
        const idx = new FlexSearch.Index({ tokenize: "forward", cache: true });
        for (const rec of data) {
          idx.add(
            rec.id,
            `${rec.title} ${rec.description} ${rec.headings.join(" ")} ${rec.text}`,
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

  const results = useMemo(() => {
    if (!query.trim() || !indexRef.current) return [];
    const ids = indexRef.current.search(query, { limit: 12 }) as number[];
    const byId = new Map(records.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as Record[];
  }, [query, records]);

  useEffect(() => setActive(0), [query]);

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
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-[0_30px_60px_-24px_rgba(31,26,20,0.4)]"
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
          />
          <kbd className="rounded border border-ink/15 bg-paper-warm px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle">
            esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-ink-subtle">
              {t.noResults}
            </p>
          )}
          <ul>
            {results.map((r, i) => (
              <li key={r.href}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.href)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                    i === active ? "bg-moss/[0.1]" : "hover:bg-paper-deep/50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-clay">
                      {t.sections[r.section]}
                    </span>
                  </span>
                  <span className="text-[14.5px] font-medium text-ink">{r.title}</span>
                  {r.description && (
                    <span className="line-clamp-1 text-[13px] text-ink-muted">
                      {r.description}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
