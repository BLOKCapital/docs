"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavNode } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Does this subtree contain a link to `pathname`? */
function containsHref(node: NavNode, pathname: string): boolean {
  if (node.type === "doc") return node.href === pathname;
  if (node.href === pathname) return true;
  return node.items.some((child) => containsHref(child, pathname));
}

function NavLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  const ref = useRef<HTMLAnchorElement>(null);

  // Bring the current page into view on load — on the longer trees (Builders
  // has 16 entries) the active item can otherwise start below the fold.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/s relative block rounded-md py-2 pl-3 pr-2 text-[13.5px] leading-snug transition-colors duration-150",
        active
          ? "bg-moss/[0.08] font-medium text-moss-deep"
          : "text-ink-muted hover:bg-paper-deep/60 hover:text-ink",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-0 w-[2px] rounded-full transition-colors",
          active ? "bg-clay" : "bg-transparent group-hover/s:bg-ink/15",
        )}
      />
      {label}
    </Link>
  );
}

function Category({ node, depth }: { node: Extract<NavNode, { type: "category" }>; depth: number }) {
  const pathname = usePathname();
  const containsActive = containsHref(node, pathname ?? "");
  const [open, setOpen] = useState(containsActive || depth === 0);

  // `useState`'s initial value only runs on mount, and React preserves this
  // component's state across App Router param changes — so without this sync,
  // navigating into a collapsed group (via search or the prev/next pager) left
  // the active page hidden inside a closed category.
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-md py-1.5 pl-2 pr-2 text-left text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-subtle transition-colors hover:text-ink"
      >
        {node.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden
          className={cn("shrink-0 transition-transform duration-200", open ? "rotate-90" : "")}
        >
          <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className={cn("mt-0.5 space-y-0.5", depth >= 0 && "border-l border-ink/[0.08] pl-2")}>
          {node.href && <NavLink label={node.label} href={node.href} />}
          {node.items.map((child, i) =>
            child.type === "doc" ? (
              <li key={child.href}>
                <NavLink label={child.label} href={child.href} />
              </li>
            ) : (
              <Category key={`${child.label}-${i}`} node={child} depth={depth + 1} />
            ),
          )}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({ nav }: { nav: NavNode[] }) {
  return (
    <nav aria-label="Docs navigation" className="text-sm">
      <ul className="space-y-1.5">
        {nav.map((node, i) =>
          node.type === "doc" ? (
            <li key={node.href}>
              <NavLink label={node.label} href={node.href} />
            </li>
          ) : (
            <Category key={`${node.label}-${i}`} node={node} depth={0} />
          ),
        )}
      </ul>
    </nav>
  );
}
