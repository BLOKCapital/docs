"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/nav/LocaleSwitcher";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { MobileNav } from "@/components/docs/MobileNav";
import { SECTIONS, UI, EXTERNAL, type Locale, type SectionSlug } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * `sectionEntries` maps each section to its first doc. Tabs link straight
 * there rather than to `/<locale>/<section>`, which only redirects — one hop
 * saved on the site's most-used control.
 */
export function Nav({
  locale,
  sectionEntries,
}: {
  locale: Locale;
  sectionEntries: Record<SectionSlug, string>;
}) {
  const pathname = usePathname();
  const t = UI[locale];

  /** Active for the whole section, however deep the current page sits. */
  const isActive = (slug: SectionSlug) => {
    const root = `/${locale}/${slug}`;
    return pathname === root || (pathname?.startsWith(`${root}/`) ?? false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
        {/* Section nav for small screens sits here, in the header, where users
            look for it — and stays put as the page scrolls. */}
        <MobileNav locale={locale} />

        <Link
          href={sectionEntries[SECTIONS[0].slug]}
          className="flex shrink-0 items-center gap-2.5 rounded p-1 text-ink transition-opacity hover:opacity-85"
          aria-label={`${t.home}, BLOK Capital Docs`}
        >
          <Logo />
          <span className="hidden text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-subtle sm:inline">
            Docs
          </span>
        </Link>

        {/* Section tabs */}
        <nav aria-label="Sections" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {SECTIONS.map((s) => {
              const active = isActive(s.slug);
              return (
                <li key={s.slug}>
                  <Link
                    href={sectionEntries[s.slug]}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-[36px] items-center rounded-full px-3.5 text-[13.5px] font-medium transition-colors",
                      active
                        ? "bg-moss/[0.1] text-moss-deep"
                        : "text-ink-muted hover:bg-paper-deep/50 hover:text-ink",
                    )}
                  >
                    {t.sections[s.slug]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger locale={locale} />
          <LocaleSwitcher current={locale} />
          {/* GitHub is the expected header affordance for developer docs, and a
              visible open-source signal. Icon-only so it fits on phones too. */}
          <a
            href={EXTERNAL.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub (opens in a new tab)"
            className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 bg-paper-warm text-ink-subtle transition-colors hover:border-ink/30 hover:text-ink"
          >
            <GitHubGlyph />
          </a>
          <a
            href={EXTERNAL.site}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 pl-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink lg:inline-flex"
          >
            blokcapital.io
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="opacity-60">
              <path d="M2 8 L8 2 M3.5 2 L8 2 L8 6.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mobile section tabs. The edge fade signals that the row scrolls. */}
      <nav aria-label="Sections" className="relative border-t border-ink/10 md:hidden">
        <ul className="flex items-center gap-1 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => {
            const active = isActive(s.slug);
            return (
              <li key={s.slug} className="shrink-0">
                <Link
                  href={sectionEntries[s.slug]}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-[40px] items-center rounded-full px-3.5 text-[13px] font-medium transition-colors",
                    active ? "bg-moss/[0.1] text-moss-deep" : "text-ink-muted",
                  )}
                >
                  {t.sections[s.slug]}
                </Link>
              </li>
            );
          })}
        </ul>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent"
        />
      </nav>
    </header>
  );
}

function GitHubGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
