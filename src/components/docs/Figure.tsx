import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for diagrams and figures: a warm-paper frame with a rounded
 * border that matches the docs cards, horizontal scroll for wide content, and
 * an optional caption rendered as a real <figcaption> (good for a11y + SEO).
 *
 * `narrow` constrains the frame to a centered column for vertical/journey
 * diagrams that look stretched at full article width.
 */
export function Figure({
  children,
  caption,
  narrow,
}: {
  children: ReactNode;
  caption?: string;
  narrow?: boolean;
}) {
  return (
    <figure
      className={cn(
        "my-7 overflow-hidden rounded-2xl border border-ink/10 bg-paper-warm",
        narrow && "mx-auto max-w-xl",
      )}
    >
      <div className="overflow-x-auto p-5 sm:p-7">{children}</div>
      {caption && (
        <figcaption className="border-t border-ink/10 px-5 py-2.5 text-[12.5px] leading-relaxed text-ink-subtle">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
