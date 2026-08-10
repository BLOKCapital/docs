"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import routes from "@/lib/generated/markdown-routes.json";
import {
  LOCALES,
  LOCALE_LABELS,
  EXTERNAL,
  UI,
  isLocale,
  type Locale,
} from "@/lib/config";
import { cn } from "@/lib/utils";

/** Every doc route that actually exists, across all locales. */
const DOC_ROUTES = new Set<string>(routes as string[]);

/** Swap the leading /<locale> segment of `pathname` for `locale`. */
function pathIn(pathname: string, locale: Locale): string {
  const parts = (pathname || "/").split("/");
  if (isLocale(parts[1] ?? "")) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join("/") || `/${locale}`;
}

/**
 * Is the current page available in `locale`?
 *
 * The home page and the four section landings are generated for every locale,
 * so only doc routes need checking. Content parity is *not* guaranteed —
 * `resources/brand-guidelines/logo-design` exists in English only — and
 * `dynamicParams = false` means a missing translation is a hard 404. Blindly
 * swapping the segment used to walk users straight into one.
 */
function existsIn(pathname: string, locale: Locale): boolean {
  const target = pathIn(pathname, locale).replace(/\/+$/, "") || "/";
  const depth = target.split("/").filter(Boolean).length;
  if (depth <= 2) return true; // /<locale> and /<locale>/<section>
  return DOC_ROUTES.has(target);
}

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() ?? `/${current}`;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = UI[current];

  // Escape closes and returns focus; outside clicks dismiss.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onDown(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  /** Roving arrow-key navigation across the menu items. */
  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitemradio'], [role='menuitem']") ?? [],
    ).filter((el) => !el.hasAttribute("aria-disabled"));
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? items[(i + 1) % items.length]
        : items[(i - 1 + items.length) % items.length];
    next.focus();
  }

  function switchTo(locale: Locale) {
    setOpen(false);
    router.push(pathIn(pathname, locale));
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${LOCALE_LABELS[current]}, ${t.helpTranslate}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-ink/15 bg-paper-warm px-3 text-[13px] font-medium text-ink-muted transition-colors hover:border-ink/30 hover:text-ink"
      >
        <GlobeGlyph />
        {current.toUpperCase()}
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className={cn("transition-transform", open && "rotate-180")}>
          <path d="M1.5 3 L5 7 L8.5 3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Language"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-[190px] overflow-hidden rounded-xl border border-ink/10 bg-paper py-1 shadow-[0_18px_36px_-20px_rgba(31,26,20,0.3)]"
        >
          {LOCALES.map((l) => {
            const available = existsIn(pathname, l);
            return (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={l === current}
                aria-disabled={!available || undefined}
                disabled={!available}
                onClick={() => switchTo(l)}
                className={cn(
                  "flex min-h-[40px] w-full items-center justify-between gap-3 px-3.5 text-left text-[13.5px] transition-colors",
                  !available && "cursor-not-allowed opacity-55",
                  available && "hover:bg-paper-deep/60",
                  l === current ? "font-medium text-moss-deep" : "text-ink-muted",
                )}
              >
                <span className="flex flex-col">
                  {LOCALE_LABELS[l]}
                  {!available && (
                    <span className="text-[11px] text-ink-subtle">
                      {t.notTranslated}
                    </span>
                  )}
                </span>
                {l === current && (
                  <span aria-hidden className="text-clay-deep">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
          <div className="mt-1 border-t border-ink/10 pt-1">
            <a
              role="menuitem"
              href={EXTERNAL.githubDocs}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-[40px] w-full items-center gap-1.5 px-3.5 text-left text-[13px] text-ink-subtle transition-colors hover:bg-paper-deep/60 hover:text-ink"
            >
              {t.helpTranslate}
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="opacity-60">
                <path d="M2 8 L8 2 M3.5 2 L8 2 L8 6.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
              </svg>
            </a>
          </div>
        </div>
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
