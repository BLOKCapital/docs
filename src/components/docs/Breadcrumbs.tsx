import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Section · subsection trail above the page title. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-subtle">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="inline-flex items-center gap-2">
            {c.href ? (
              <Link href={c.href} className="transition-colors hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className="text-ink-muted">{c.label}</span>
            )}
            {i < items.length - 1 && (
              <span aria-hidden className="text-ink/25">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
