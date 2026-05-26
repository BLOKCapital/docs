"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SearchState = { open: boolean; setOpen: (v: boolean) => void };

const Ctx = createContext<SearchState | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useSearch() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
