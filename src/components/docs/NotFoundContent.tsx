"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import {
  DEFAULT_LOCALE,
  SECTIONS,
  SECTION_BLURB,
  UI,
  EXTERNAL,
  isLocale,
  LOCALE_LABELS,
  type Locale,
  type SectionSlug,
} from "@/lib/config";

/**
 * Body of the 404 page.
 *
 * This carries its own chrome rather than inheriting the site header. Next
 * renders a `notFound()` boundary under the *root* layout only — and in this app
 * `<html>`/`<body>` and the nav live in `[locale]/layout.tsx`, one level down —
 * so a 404 can never inherit the real header. Instead of leaving users on a dead
 * end with a single button, the page ships its own way out: home, every section,
 * and the marketing site.
 *
 * The locale is recovered from the pathname, since `not-found` receives no
 * route params.
 */
export function NotFoundContent({
  sectionEntries,
}: {
  /** Section -> first doc, per locale, so the cards below skip the redirect. */
  sectionEntries: Record<Locale, Record<SectionSlug, string>>;
}) {
  const pathname = usePathname() ?? "/";
  const segment = pathname.split("/")[1] ?? "";
  const locale: Locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  const t = UI[locale];
  const entries = sectionEntries[locale];

  // A miss on a non-default locale is most often a page that exists only in
  // English, so offer that directly rather than only sending them home.
  const englishHref =
    isLocale(segment) && locale !== DEFAULT_LOCALE
      ? `/${DEFAULT_LOCALE}${pathname.slice(segment.length + 1)}`
      : null;

  return (
    <div className="paper relative isolate flex min-h-screen flex-col">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-2.5 px-4 sm:px-6">
          <Link
            href={entries[SECTIONS[0].slug]}
            className="flex shrink-0 items-center gap-2.5 rounded p-1 text-ink transition-opacity hover:opacity-85"
            aria-label={`${t.home}, BLOK Capital Docs`}
          >
            <Logo />
            <span className="hidden text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-subtle sm:inline">
              Docs
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 sm:px-8">
        <p className="eyebrow text-moss">404</p>
        <h1 className="display mt-3 text-[36px] leading-tight text-ink sm:text-[44px]">
          {t.notFound.title}
        </h1>
        <p className="mt-4 max-w-prose text-[16px] leading-relaxed text-ink-muted">
          {t.notFound.body}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={entries[SECTIONS[0].slug]}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-moss px-5 text-sm font-medium text-paper transition-colors hover:bg-moss-deep"
          >
            ← {t.notFound.cta}
          </Link>
          {englishHref && (
            <Link
              href={englishHref}
              className="inline-flex min-h-[44px] items-center rounded-full border border-ink/15 bg-paper-warm px-5 text-sm font-medium text-ink transition-colors hover:border-ink/30"
            >
              {LOCALE_LABELS[DEFAULT_LOCALE]} →
            </Link>
          )}
        </div>

        <div aria-hidden className="rule-hand my-10" />

        {/* Real onward routes, so this is a junction rather than a dead end. */}
        <nav aria-label="Sections" className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.slug}
              href={entries[s.slug]}
              className="group/c flex flex-col rounded-2xl border border-ink/10 bg-paper-warm p-5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-moss/30 hover:bg-moss/[0.04]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="display text-[19px] text-ink">{t.sections[s.slug]}</h2>
                <span aria-hidden className="shrink-0 text-clay-deep transition-transform duration-200 group-hover/c:translate-x-1">
                  →
                </span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
                {SECTION_BLURB[locale][s.slug]}
              </p>
            </Link>
          ))}
        </nav>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-[13px] text-ink-subtle sm:px-6">
          <a
            href={EXTERNAL.site}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            blokcapital.io
          </a>
          <a
            href={EXTERNAL.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <a
            href={EXTERNAL.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            Discord
          </a>
        </div>
      </footer>
    </div>
  );
}
