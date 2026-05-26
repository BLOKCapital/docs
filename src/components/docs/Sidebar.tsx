"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavNode } from "@/lib/content";
import { cn } from "@/lib/utils";

function NavLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/s relative block rounded-md py-1.5 pl-3 pr-2 text-[13.5px] leading-snug transition-colors duration-150",
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
  // Open by default if a descendant is active.
  const containsActive = JSON.stringify(node).includes(`"href":"${pathname}"`);
  const [open, setOpen] = useState(containsActive || depth === 0);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1.5 pl-2 pr-2 text-left text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-subtle transition-colors hover:text-ink"
      >
        {node.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden
          className={cn("transition-transform duration-200", open ? "rotate-90" : "")}
        >
          <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className={cn("mt-0.5 space-y-0.5", depth >= 0 && "border-l border-ink/8 pl-2")}>
          {node.href && <NavLink label="Overview" href={node.href} />}
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
