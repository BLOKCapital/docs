import type { Locale, SectionSlug } from "@/lib/config";

export type SearchHeading = { text: string; slug: string };

export type SearchRecord = {
  id: number;
  href: string;
  title: string;
  section: SectionSlug;
  description: string;
  headings: SearchHeading[];
  symbols: string[];
  text: string;
};

/**
 * Per-locale index loads, deduplicated and memoized for the page's lifetime.
 *
 * The index is ~140 KB, so it is fetched lazily — but the navbar trigger warms
 * it on hover/focus, which means by the time the dialog opens the promise is
 * usually already settled. Sharing one promise here is what makes that warm-up
 * and the dialog's own load the same request rather than two.
 */
const cache = new Map<Locale, Promise<SearchRecord[]>>();

export function loadSearchIndex(locale: Locale): Promise<SearchRecord[]> {
  let pending = cache.get(locale);
  if (!pending) {
    pending = fetch(`/search/${locale}.json`).then((r) => {
      if (!r.ok) throw new Error(`search index ${locale}: HTTP ${r.status}`);
      return r.json() as Promise<SearchRecord[]>;
    });
    // Drop a rejected promise so a retry can genuinely re-fetch instead of
    // resolving to the same cached failure.
    pending.catch(() => cache.delete(locale));
    cache.set(locale, pending);
  }
  return pending;
}

/** Fire-and-forget warm-up; failures are surfaced later by the dialog. */
export function prefetchSearchIndex(locale: Locale): void {
  loadSearchIndex(locale).catch(() => {});
}

export function resetSearchIndex(locale: Locale): void {
  cache.delete(locale);
}
