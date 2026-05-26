"use client";

import { useEffect } from "react";
import { useSearch } from "@/components/search/SearchContext";
import { SearchDialog } from "@/components/search/SearchDialog";
import { UI, type Locale } from "@/lib/config";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper-warm py-1.5 pl-3 pr-2.5 text-[13px] text-ink-subtle transition-colors hover:border-ink/30 hover:text-ink-muted"
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
