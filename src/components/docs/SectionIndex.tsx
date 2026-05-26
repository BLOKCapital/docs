import Link from "next/link";
import { flattenNav, type NavNode } from "@/lib/content";

/** A single entry in the section landing grid. */
function entryFor(node: NavNode): {
  label: string;
  href: string;
  count: number;
} {
  if (node.type === "doc") {
    return { label: node.label, href: node.href, count: 0 };
  }
  const leaves = flattenNav(node.items);
  return {
    label: node.label,
    href: node.href ?? leaves[0]?.href ?? "#",
    count: leaves.length,
  };
}

/**
 * Landing page for a section root (`/<locale>/<section>`). Renders the
 * section's top-level docs and categories as a card grid, mirroring the home
 * page so sections have a real page instead of a 404.
 */
export function SectionIndex({ nav }: { nav: NavNode[] }) {
  const entries = nav.map(entryFor);

  if (entries.length === 0) {
    return (
      <p className="text-[15px] text-ink-muted">
        No pages in this section yet.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {entries.map((e) => (
        <Link
          key={e.href + e.label}
          href={e.href}
          className="group/c flex flex-col rounded-2xl border border-ink/10 bg-paper-warm p-6 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-moss/30 hover:bg-moss/[0.04]"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="display text-[20px] leading-snug text-ink">{e.label}</h2>
            <span className="shrink-0 text-clay transition-transform duration-200 group-hover/c:translate-x-1">
              →
            </span>
          </div>
          {e.count > 0 && (
            <span className="mt-4 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
              {e.count} {e.count === 1 ? "page" : "pages"}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
