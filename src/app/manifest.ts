import type { MetadataRoute } from "next";
import { SITE, DEFAULT_LOCALE } from "@/lib/config";

/**
 * Web App Manifest. Improves PWA/installability signals and mobile
 * presentation. Colors mirror the Garden Journal theme (paper background,
 * moss accent). Served at /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.brand,
    description: SITE.tagline,
    start_url: `/${DEFAULT_LOCALE}`,
    scope: "/",
    display: "standalone",
    background_color: "#FAF7F0",
    theme_color: "#FAF7F0",
    lang: DEFAULT_LOCALE,
    categories: ["education", "finance", "developer", "documentation"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/brand/blokc-black.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
