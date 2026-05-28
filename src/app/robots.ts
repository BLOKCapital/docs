import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/**
 * robots.txt: open to all general crawlers and explicitly welcoming to AI /
 * answer-engine crawlers (ASO). Listing the AI agents by name makes intent
 * unambiguous: this is public documentation we *want* surfaced in generative
 * answers. Internal Next.js routes are disallowed to keep the index clean.
 *
 * Served at /robots.txt; references the sitemap and the canonical host.
 */
const AI_AGENTS = [
  "GPTBot", // OpenAI / ChatGPT
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // ChatGPT browsing
  "ClaudeBot", // Anthropic / Claude
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot", // Perplexity
  "Perplexity-User",
  "Google-Extended", // Gemini / Vertex training + grounding
  "GoogleOther",
  "Applebot-Extended", // Apple Intelligence
  "Amazonbot",
  "Bingbot", // Copilot / Bing
  "CCBot", // Common Crawl (feeds many LLMs)
  "cohere-ai",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Explicit allow for AI crawlers (no crawl-delay, full access).
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
