"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, EXTERNAL, UI, isLocale, type Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Swaps the leading /<locale> segment of the current path. If the equivalent
 * page doesn't exist in the target locale, Next will 404 — acceptable since
 * content has full parity across en/es/fr.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function switchTo(locale: Locale) {
    setOpen(false);
    const parts = (pathname ?? "/").split("/");
    if (isLocale(parts[1] ?? "")) {
      parts[1] = locale;
    } else {
      parts.splice(1, 0, locale);
    }
    router.push(parts.join("/") || `/${locale}`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper-warm px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <GlobeGlyph />
        {current.toUpperCase()}
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className={cn("transition-transform", open && "rotate-180")}>
          <path d="M1.5 3 L5 7 L8.5 3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-2 min-w-[150px] overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-[0_18px_36px_-20px_rgba(31,26,20,0.3)]"
          >
            {LOCALES.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => switchTo(l)}
                  className={cn(
                    "flex w-full items-center justify-between px-3.5 py-2 text-left text-[13.5px] transition-colors hover:bg-paper-deep/60",
                    l === current ? "font-medium text-moss-deep" : "text-ink-muted",
                  )}
                >
                  {LOCALE_LABELS[l]}
                  {l === current && <span aria-hidden className="text-clay">✓</span>}
                </button>
              </li>
            ))}
            <li role="presentation" className="border-t border-ink/10">
              <a
                href={EXTERNAL.githubDocs}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-1.5 px-3.5 py-2 text-left text-[13px] text-ink-subtle transition-colors hover:bg-paper-deep/60 hover:text-ink"
              >
                {UI[current].helpTranslate}
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="opacity-60">
                  <path d="M2 8 L8 2 M3.5 2 L8 2 L8 6.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
                </svg>
              </a>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

function GlobeGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1.7 8 H14.3 M8 1.7 C5 4 5 12 8 14.3 C11 12 11 4 8 1.7" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
