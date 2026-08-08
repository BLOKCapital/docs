"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/docs/Sidebar";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { useDocNav } from "@/components/docs/DocNavContext";
import { useDialog } from "@/lib/use-dialog";
import { UI, type Locale } from "@/lib/config";

/**
 * Section navigation for phones/tablets, where the left sidebar and the TOC
 * rail are both hidden.
 *
 * Lives in the sticky header rather than in the article body: navigation
 * belongs where users look for it, and keeping it in the header means it stays
 * reachable however far down the page you are. The drawer's contents come from
 * `DocNavContext`, which the doc page publishes.
 */
export function MobileNav({ locale }: { locale: Locale }) {
  const t = UI[locale];
  const pathname = usePathname();
  const docNav = useDocNav();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const panelRef = useDialog(open, close);

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Only doc routes (/<locale>/<section>/…) have a section nav to show. Derived
  // from the pathname rather than from context so the trigger is present in the
  // server-rendered HTML and doesn't pop in after hydration.
  const isDocRoute = pathname.split("/").filter(Boolean).length >= 2;
  if (!isDocRoute) return null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t.menu}
        className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 bg-paper-warm text-ink-muted transition-colors hover:border-ink/30 hover:text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Portalled to <body>. This trigger sits in the sticky header, and the
          header's `backdrop-blur` makes it the containing block for any
          `position: fixed` descendant — so rendered in place the drawer would be
          clipped to the 64px header box instead of covering the viewport. */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-hidden
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto border-r border-ink/10 bg-paper px-4 pb-10 pt-4 shadow-[0_30px_60px_-24px_rgba(31,26,20,0.5)] outline-none"
            /* Follow any nav/TOC link straight to its target and dismiss. */
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) close();
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
                {t.menu}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                className="inline-flex size-9 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-paper-deep/60 hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {docNav && <Sidebar nav={docNav.nav} />}

            {docNav && docNav.toc.length > 0 && (
              <div className="mt-6 border-t border-ink/10 pt-5">
                <TableOfContents items={docNav.toc} label={t.onThisPage} />
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
