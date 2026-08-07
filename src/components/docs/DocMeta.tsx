import { EXTERNAL, UI, type Locale } from "@/lib/config";

/** ISO date -> locale-formatted, e.g. "12 June 2026" / "12 juin 2026". */
function formatDate(iso: string, locale: Locale): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Freshness + contribution footer.
 *
 * `updatedAt` is derived from each file's last commit at build time and
 * `editPage`/`lastUpdated` have been translated all along — none of it was ever
 * rendered. Docs freshness is a primary trust signal for a protocol whose
 * contracts are still shipping, and the edit link is the cheapest contribution
 * funnel available.
 */
export function DocMeta({
  locale,
  updatedAt,
  editPath,
}: {
  locale: Locale;
  updatedAt?: string;
  editPath?: string;
}) {
  const t = UI[locale];
  const formatted = updatedAt ? formatDate(updatedAt, locale) : null;
  if (!formatted && !editPath) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-ink/10 pt-5 text-[12.5px] text-ink-subtle">
      {formatted ? (
        <p>
          {t.lastUpdated}:{" "}
          <time dateTime={updatedAt}>{formatted}</time>
        </p>
      ) : (
        <span />
      )}
      {editPath && (
        <a
          href={`${EXTERNAL.githubDocs}/edit/main/${editPath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M11.5 2.5a1.6 1.6 0 0 1 2.3 2.3L6 12.6l-3 .7.7-3Z" strokeLinejoin="round" />
          </svg>
          {t.editPage}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
