"use client";

import { useState } from "react";
import tokenData from "@/lib/data/tokenData.json";
import { cn } from "@/lib/utils";

type Slice = {
  title: string;
  value: number;
  description: string;
  subtitle: string;
};

const data = tokenData as Slice[];

// Garden Journal palette ramp — moss → sage → ochre → clay, cycled across
// slices so the donut reads warm rather than the original cool blues.
const PALETTE = [
  "#4F6F4F", "#5E7C57", "#6E8A60", "#8AA98A", "#A8B5A0",
  "#C49C47", "#CBA85E", "#C67B5C", "#B06A4E", "#9A5B41",
  "#7A6C5A", "#94836C", "#473C30",
];

const SIZE = 240;
const R = 100;
const STROKE = 34;
const C = 2 * Math.PI * R;

/**
 * Token distribution donut.
 *
 * Selection is driven by the legend, which is a real list of buttons: the chart
 * was previously hover-only, which meant touch users (no hover event) could
 * never read a slice's value and keyboard users found focusable buttons that
 * did nothing at all. Now pointer hover previews, tap/click and keyboard focus
 * both select, and the same figures are exposed as a table for screen readers.
 */
export function TokenomicsChart() {
  const [active, setActive] = useState<number | null>(null);
  /** Sticky selection from click/keyboard; hover only previews over the top. */
  const [pinned, setPinned] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const dash = frac * C;
    const arc = {
      ...d,
      color: PALETTE[i % PALETTE.length],
      dasharray: `${dash} ${C - dash}`,
      dashoffset: -offset,
      index: i,
    };
    offset += dash;
    return arc;
  });

  const shown = active ?? pinned;
  const focus = shown != null ? data[shown] : null;

  const toggle = (i: number) => setPinned((p) => (p === i ? null : i));

  return (
    <figure className="not-prose my-8 rounded-2xl border border-ink/10 bg-paper-warm p-6">
      <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
        <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
          {/* Decorative: every figure it encodes is in the legend and the table
              below, both of which are reachable and announced. */}
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {arcs.map((a) => (
                <circle
                  key={a.title}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={shown === a.index ? STROKE + 6 : STROKE}
                  strokeDasharray={a.dasharray}
                  strokeDashoffset={a.dashoffset}
                  opacity={shown == null || shown === a.index ? 1 : 0.55}
                  className="cursor-pointer transition-[stroke-width,opacity] duration-200"
                  onMouseEnter={() => setActive(a.index)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => toggle(a.index)}
                />
              ))}
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {focus ? (
              <>
                <span className="display text-[26px] text-ink">{focus.value}%</span>
                <span className="mt-0.5 text-[12px] leading-tight text-ink-muted">
                  {focus.title}
                </span>
              </>
            ) : (
              <>
                <span className="eyebrow text-moss">$BLOKC</span>
                <span className="mt-1 text-[12px] text-ink-subtle">Distribution</span>
              </>
            )}
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {arcs.map((a) => (
            <li key={a.title}>
              <button
                type="button"
                aria-pressed={pinned === a.index}
                onMouseEnter={() => setActive(a.index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(a.index)}
                onBlur={() => setActive(null)}
                onClick={() => toggle(a.index)}
                className={cn(
                  "flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                  pinned === a.index ? "bg-moss/[0.1]" : "hover:bg-paper-deep/60",
                )}
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: a.color }}
                />
                <span className="flex-1 text-[13px] text-ink-muted">{a.title}</span>
                <span className="mono text-[13px] font-medium text-ink">{a.value}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* The per-slice copy was loaded from tokenData.json but never shown. */}
      {focus?.description && (
        <p className="mt-5 border-t border-ink/10 pt-4 text-[13.5px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{focus.title}</span>
          {focus.subtitle ? ` · ${focus.subtitle}` : ""}: {focus.description}
        </p>
      )}

      <figcaption className="sr-only">
        <table>
          <caption>$BLOKC token distribution</caption>
          <thead>
            <tr>
              <th scope="col">Allocation</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.title}>
                <th scope="row">{d.title}</th>
                <td>{d.value}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
