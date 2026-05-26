import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Kind = "note" | "tip" | "info" | "warning" | "danger";

const LABELS: Record<Kind, string> = {
  note: "Note",
  tip: "Tip",
  info: "Info",
  warning: "Warning",
  danger: "Danger",
};

const GLYPH: Record<Kind, string> = {
  note: "✎",
  tip: "✶",
  info: "ℹ",
  warning: "▲",
  danger: "✺",
};

/**
 * Callout box used by MDX `:::note` … `:::` blocks (rewritten to
 * <Admonition kind="note"> at migration time) and reusable directly in MDX.
 */
export function Admonition({
  kind = "note",
  title,
  children,
}: {
  kind?: Kind;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("admonition", `admonition-${kind}`)}>
      <p className="admonition-title">
        <span aria-hidden>{GLYPH[kind]}</span>
        {title ?? LABELS[kind]}
      </p>
      {children}
    </div>
  );
}
