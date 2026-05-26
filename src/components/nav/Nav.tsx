"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LocaleSwitcher } from "@/components/nav/LocaleSwitcher";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { SECTIONS, UI, EXTERNAL, type Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Nav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = UI[locale];

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2.5 rounded p-1 text-ink transition-opacity hover:opacity-85"
          aria-label="BLOK Capital Docs, home"
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
              const href = `/${locale}/${s.slug}`;
              const active = pathname?.startsWith(href);
              return (
                <li key={s.slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
                      active
                        ? "bg-moss/[0.1] text-moss-deep"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {t.sections[s.slug]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <SearchTrigger locale={locale} />
          <LocaleSwitcher current={locale} />
          <a
            href={EXTERNAL.site}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink lg:inline-flex"
          >
            blokcapital.io
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="opacity-60">
              <path d="M2 8 L8 2 M3.5 2 L8 2 L8 6.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mobile section tabs */}
      <nav aria-label="Sections" className="border-t border-ink/8 md:hidden">
        <ul className="flex items-center gap-1 overflow-x-auto px-4 py-2">
          {SECTIONS.map((s) => {
            const href = `/${locale}/${s.slug}`;
            const active = pathname?.startsWith(href);
            return (
              <li key={s.slug} className="shrink-0">
                <Link
                  href={href}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active ? "bg-moss/[0.1] text-moss-deep" : "text-ink-muted",
                  )}
                >
                  {t.sections[s.slug]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
