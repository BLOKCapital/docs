import GithubSlugger from "github-slugger";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

/**
 * Extract h2/h3 headings from an MDX body for the "On this page" rail.
 * Slugs are generated with the same algorithm rehype-slug uses so the
 * anchors match the rendered ids. Fenced code blocks are skipped so `#`
 * comments inside code aren't mistaken for headings.
 */
export function extractToc(body: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of body.split("\n")) {
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const depth = m[1].length as 2 | 3;
    // Strip inline markdown (links, emphasis, code ticks) for the label.
    const text = m[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim();
    items.push({ id: slugger.slug(text), text, depth });
  }

  return items;
}
