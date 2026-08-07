"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { NavNode } from "@/lib/content";
import type { TocItem } from "@/lib/toc";

export type DocNavValue = { nav: NavNode[]; toc: TocItem[] } | null;

const Ctx = createContext<{
  value: DocNavValue;
  set: (v: DocNavValue) => void;
} | null>(null);

/**
 * Carries the current page's section nav + table of contents up to the sticky
 * header.
 *
 * The header lives in the locale layout, but the nav tree is read from the
 * filesystem by the page below it — so the page publishes it here and the
 * header's mobile drawer consumes it. This is what lets the "Menu" control sit
 * in the header (where users look for navigation, and where it stays reachable
 * while scrolling) instead of floating inside the article body.
 */
export function DocNavProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<DocNavValue>(null);
  const set = useCallback((v: DocNavValue) => setValue(v), []);
  return <Ctx.Provider value={{ value, set }}>{children}</Ctx.Provider>;
}

export function useDocNav(): DocNavValue {
  return useContext(Ctx)?.value ?? null;
}

/**
 * Rendered by the doc page to publish its nav tree. Keyed on the pathname:
 * `nav`/`toc` are fresh object identities on every render, so depending on them
 * directly would loop — but they only ever change when the route does.
 */
export function DocNavRegistrar({
  nav,
  toc,
}: {
  nav: NavNode[];
  toc: TocItem[];
}) {
  const ctx = useContext(Ctx);
  const pathname = usePathname();
  const set = ctx?.set;

  useEffect(() => {
    if (!set) return;
    set({ nav, toc });
    return () => set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, set]);

  return null;
}
