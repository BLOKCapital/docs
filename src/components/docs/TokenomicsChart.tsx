"use client";

import { useState } from "react";
import tokenData from "@/lib/data/tokenData.json";

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

export function TokenomicsChart() {
  const [active, setActive] = useState<number | null>(null);
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

  const focus = active != null ? data[active] : null;

  return (
    <div className="my-8 grid items-center gap-8 rounded-2xl border border-ink/10 bg-paper-warm p-6 sm:grid-cols-[auto_1fr]">
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Token distribution donut chart"
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((a) => (
              <circle
                key={a.title}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth={active === a.index ? STROKE + 6 : STROKE}
                strokeDasharray={a.dasharray}
                strokeDashoffset={a.dashoffset}
                className="cursor-pointer transition-[stroke-width] duration-200"
                onMouseEnter={() => setActive(a.index)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {focus ? (
            <>
              <span className="display text-[26px] text-ink">{focus.value}%</span>
              <span className="mt-0.5 max-w-[120px] text-[12px] leading-tight text-ink-muted">
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

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {arcs.map((a) => (
          <li key={a.title}>
            <button
              type="button"
              onMouseEnter={() => setActive(a.index)}
              onMouseLeave={() => setActive(null)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-paper-deep/60"
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
  );
}
