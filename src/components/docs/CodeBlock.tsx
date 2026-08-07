"use client";

import { useRef, useState, type HTMLAttributes } from "react";

/**
 * Wraps every fenced code block with a copy button.
 *
 * The text is read from the rendered `<pre>` rather than threaded through as a
 * prop: rehype-pretty-code has already tokenized the source into nested spans by
 * the time this renders, and `textContent` reconstructs the original exactly —
 * including the line breaks — with no need to carry a second copy of every
 * snippet into the payload.
 */
export function CodeBlock({
  copyLabel,
  copiedLabel,
  ...props
}: HTMLAttributes<HTMLPreElement> & {
  copyLabel: string;
  copiedLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    const text = ref.current?.querySelector("pre")?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API is unavailable (insecure origin, or denied) — fall back
      // to selecting the block so the user can copy manually.
      const pre = ref.current?.querySelector("pre");
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block" ref={ref}>
      <button
        type="button"
        onClick={copy}
        className="code-copy"
        data-copied={copied || undefined}
        aria-label={copied ? copiedLabel : copyLabel}
      >
        {copied ? <CheckGlyph /> : <CopyGlyph />}
        <span aria-hidden>{copied ? copiedLabel : copyLabel}</span>
      </button>
      <pre {...props} />
      {/* Announce the result without moving focus off the button. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}

function CopyGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 5.5v-1a1.6 1.6 0 0 0-1.6-1.6H4a1.6 1.6 0 0 0-1.6 1.6v4.9A1.6 1.6 0 0 0 4 11h1" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8.5 L6.5 12 L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
