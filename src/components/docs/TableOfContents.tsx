"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";
import { cn } from "@/lib/utils";

/**
 * "On this page" rail. Each heading is observed; the topmost intersecting
 * one is highlighted. Mirrors the marketing site's PolicyTOC scroll-spy.
 */
export function TableOfContents({
  items,
  label,
}: {
  items: TocItem[];
  label: string;
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] },
    );
    const nodes: HTMLElement[] = [];
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) {
        observer.observe(el);
        nodes.push(el);
      }
    }
    return () => {
      for (const el of nodes) observer.unobserve(el);
      observer.disconnect();
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="text-[13px]">
      <p className="eyebrow mb-3 text-moss">{label}</p>
      <ul className="space-y-1.5">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <li key={it.id} className={cn("leading-snug", it.depth === 3 && "pl-3")}>
              <a
                href={`#${it.id}`}
                className={cn(
                  "block border-l-2 py-0.5 pl-3 transition-colors duration-150",
                  isActive
                    ? "border-clay font-medium text-moss-deep"
                    : "border-transparent text-ink-muted hover:border-ink/20 hover:text-ink",
                )}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
