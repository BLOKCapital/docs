import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config";

/**
 * Default social-share / answer-engine preview card (1200×630), generated at
 * build time with the Garden Journal palette. Used as the fallback Open Graph
 * + Twitter image across the site; individual pages inherit it via metadata.
 */
export const alt = `${SITE.brand}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#FAF7F0",
          backgroundImage:
            "radial-gradient(900px 500px at 85% -10%, rgba(79,111,79,0.18), transparent 60%), radial-gradient(700px 400px at 0% 110%, rgba(198,123,92,0.18), transparent 60%)",
          color: "#1F1A14",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#4F6F4F",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#4F6F4F",
              fontWeight: 600,
            }}
          >
            {`${SITE.brand} · Docs`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Decentralized wealth management, documented.
          </div>
          <div style={{ fontSize: 30, color: "#473C30", maxWidth: 880, lineHeight: 1.3 }}>
            Concepts · Smart Contracts · Builders · Resources
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#7A6C5A" }}>
          <span>docs.blokcapital.io</span>
          <span>Non-custodial · On-chain · EIP-2535</span>
        </div>
      </div>
    ),
    size,
  );
}
