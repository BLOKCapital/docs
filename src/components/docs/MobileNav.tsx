"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/docs/Sidebar";
import { TableOfContents } from "@/components/docs/TableOfContents";
import type { NavNode } from "@/lib/content";
import type { TocItem } from "@/lib/toc";

/**
 * Below `lg` the left sidebar and the TOC rail are both hidden, leaving no way
 * to navigate within a section on phones/tablets. This trigger + slide-in
 * drawer surfaces the section nav (and "On this page") on small screens. It is
 * `lg:hidden`, so on large screens the persistent rails take over.
 */
export function MobileNav({
  nav,
  toc,
  menuLabel,
  onThisPage,
}: {
  nav: NavNode[];
  toc: TocItem[];
  menuLabel: string;
  onThisPage: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change and lock body scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label={menuLabel}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper-warm px-3.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {menuLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden onClick={() => setOpen(false)} />
          {/* Close the drawer when any nav/TOC link is followed. */}
          <div
            className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto border-r border-ink/10 bg-paper px-4 pb-10 pt-4 shadow-[0_30px_60px_-24px_rgba(31,26,20,0.5)]"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
                {menuLabel}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-subtle transition-colors hover:bg-paper-deep/60 hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <Sidebar nav={nav} />

            {toc.length > 0 && (
              <div className="mt-6 border-t border-ink/10 pt-5">
                <TableOfContents items={toc} label={onThisPage} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
