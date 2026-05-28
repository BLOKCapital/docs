"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Figure } from "./Figure";

/**
 * Garden Journal palette mapped onto Mermaid's theme variables, so diagrams
 * read as part of the docs (warm paper fills, moss borders, ink text, clay +
 * ochre accents) instead of foreign white screenshots. Hex values mirror the
 * CSS tokens in globals.css (the site is light-only).
 */
const themeVariables = {
  background: "transparent",
  fontFamily: "var(--font-body), Inter, system-ui, sans-serif",
  fontSize: "14px",
  primaryColor: "#F4EEE0", // paper-warm, default node fill
  primaryBorderColor: "#4F6F4F", // moss
  primaryTextColor: "#1F1A14", // ink
  secondaryColor: "#EAE0CC", // paper-deep
  secondaryBorderColor: "#C67B5C", // clay
  secondaryTextColor: "#1F1A14",
  tertiaryColor: "#FAF7F0", // paper
  tertiaryBorderColor: "#A8B5A0", // sage
  tertiaryTextColor: "#1F1A14",
  lineColor: "#473C30", // ink-2
  textColor: "#1F1A14",
  mainBkg: "#F4EEE0",
  nodeBorder: "#4F6F4F",
  clusterBkg: "#FAF7F0",
  clusterBorder: "#C67B5C",
  edgeLabelBackground: "#FAF7F0",
  // sequence/actor styling (kept on-palette for any sequence diagrams)
  actorBkg: "#F4EEE0",
  actorBorder: "#4F6F4F",
  actorTextColor: "#1F1A14",
  signalColor: "#473C30",
  signalTextColor: "#1F1A14",
  noteBkgColor: "#EAE0CC",
  noteBorderColor: "#C67B5C",
};

let initialized = false;

/**
 * Client-rendered Mermaid diagram. Mermaid is dynamically imported so its
 * weight only loads on pages that actually contain a diagram. Falls back to the
 * raw source in a <pre> if rendering fails, so content is never lost.
 */
export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void import("mermaid").then(async ({ default: mermaid }) => {
      if (!initialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "strict",
          themeVariables,
          flowchart: { curve: "basis", htmlLabels: true, padding: 14, useMaxWidth: true },
        });
        initialized = true;
      }
      try {
        const { svg } = await mermaid.render(`mmd-${reactId}`, chart.trim());
        if (active && ref.current) ref.current.innerHTML = svg;
      } catch {
        if (active) setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [chart, reactId]);

  return (
    <Figure caption={caption}>
      {failed ? (
        <pre className="overflow-x-auto text-[12px] leading-relaxed text-ink-muted">
          {chart.trim()}
        </pre>
      ) : (
        <div
          ref={ref}
          role="img"
          aria-label={caption ?? "Diagram"}
          className="mermaid flex min-h-[120px] items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full"
        />
      )}
    </Figure>
  );
}
