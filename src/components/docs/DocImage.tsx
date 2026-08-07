"use client";

import { useCallback, useState, type ImgHTMLAttributes } from "react";
import manifest from "@/lib/generated/image-manifest.json";
import { useDialog } from "@/lib/use-dialog";

type ImageMeta = { width: number; height: number };
const SIZES = manifest as Record<string, ImageMeta>;

/**
 * Content images.
 *
 * next/image can't be used here — sources live in /public with arbitrary aspect
 * ratios — so dimensions come from a build-time manifest instead. That gives us
 * three things a bare <img> didn't have:
 *
 *  - `width`/`height`, so the browser reserves the box and the page stops
 *    reflowing as images load;
 *  - an intrinsic `max-width`, so a 613px diagram is no longer stretched across
 *    the ~950px column into a blurry mess;
 *  - click-to-zoom, because the architecture diagrams are far larger than the
 *    column and their labels are unreadable at column width.
 */
export function DocImage({
  src,
  alt = "",
  enlargeLabel,
  closeLabel,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & {
  enlargeLabel: string;
  closeLabel: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const close = useCallback(() => setZoomed(false), []);
  const panelRef = useDialog(zoomed, close);

  const key = typeof src === "string" ? src : "";
  const meta = SIZES[key];
  // Only offer zoom when the source is meaningfully larger than the column.
  const canZoom = !!meta && meta.width > 700;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={key}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={meta?.width}
      height={meta?.height}
      style={meta ? { maxWidth: `min(100%, ${meta.width}px)` } : undefined}
      className={canZoom ? "zoomable" : undefined}
      {...rest}
    />
  );

  if (!canZoom) return img;

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`${enlargeLabel}${alt ? `: ${alt}` : ""}`}
        className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
      >
        {img}
      </button>

      {zoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" aria-hidden onClick={close} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={alt || enlargeLabel}
            tabIndex={-1}
            className="relative max-h-full max-w-full overflow-auto outline-none"
          >
            <button
              type="button"
              onClick={close}
              aria-label={closeLabel}
              className="absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-full border border-paper/25 bg-ink/70 text-paper transition-colors hover:bg-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={key}
              alt={alt}
              width={meta.width}
              height={meta.height}
              className="h-auto max-h-[88vh] w-auto max-w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
