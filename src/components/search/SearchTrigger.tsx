"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearch } from "@/components/search/SearchContext";
import { prefetchSearchIndex } from "@/lib/search-index";
import { UI, type Locale } from "@/lib/config";

/**
 * The dialog pulls in FlexSearch, which has no business in the bundle of a page
 * nobody has searched on yet. Loaded on demand — by the time the chunk lands the
 * index warm-up below has usually finished too.
 */
const SearchDialog = dynamic(
  () => import("@/components/search/SearchDialog").then((m) => m.SearchDialog),
  { ssr: false },
);

/** Navbar search button + global ⌘K / Ctrl-K shortcut. */
export function SearchTrigger({ locale }: { locale: Locale }) {
  const { open, setOpen } = useSearch();
  const t = UI[locale];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Warm the index the moment intent shows, so the dialog usually opens onto a
  // ready index instead of a spinner.
  const warm = () => prefetchSearchIndex(locale);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={warm}
        onFocus={warm}
        className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-ink/15 bg-paper-warm py-1.5 pl-3 pr-2.5 text-[13px] text-ink-subtle transition-colors hover:border-ink/30 hover:text-ink-muted"
        aria-label={t.search}
      >
        <SearchGlyph />
        <span className="hidden sm:inline">{t.search}</span>
        <kbd className="hidden rounded border border-ink/15 bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle sm:inline">
          ⌘K
        </kbd>
      </button>
      {open && <SearchDialog locale={locale} onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
