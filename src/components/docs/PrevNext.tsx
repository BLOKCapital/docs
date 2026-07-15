import Link from "next/link";

type Item = { label: string; href: string } | null;

/** Footer pager linking to the previous and next docs in reading order. */
export function PrevNext({
  prev,
  next,
  prevLabel,
  nextLabel,
}: {
  prev: Item;
  next: Item;
  prevLabel: string;
  nextLabel: string;
}) {
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="Pagination"
      className="mt-14 grid gap-4 border-t border-ink/10 pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group/p flex flex-col rounded-xl border border-ink/10 bg-paper-warm px-4 py-3 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-moss/30"
        >
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            ← {prevLabel}
          </span>
          <span className="mt-0.5 text-[14.5px] font-medium text-ink">
            {prev.label}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group/n flex flex-col rounded-xl border border-ink/10 bg-paper-warm px-4 py-3 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-moss/30 sm:items-end sm:text-right"
        >
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            {nextLabel} →
          </span>
          <span className="mt-0.5 text-[14.5px] font-medium text-ink">
            {next.label}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
