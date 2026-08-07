import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import type {
  ImgHTMLAttributes,
  AnchorHTMLAttributes,
  HTMLAttributes,
  TableHTMLAttributes,
} from "react";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { Admonition } from "@/components/docs/Admonition";
import { TokenomicsChart } from "@/components/docs/TokenomicsChart";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocImage } from "@/components/docs/DocImage";
import { Figure } from "@/components/docs/Figure";
import { UI, DEFAULT_LOCALE, type Locale } from "@/lib/config";

/** Internal links route through next/link; external open in a new tab. */
function MdxLink({ href = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = /^https?:\/\//.test(href) || href.startsWith("//");
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
  }
  return <Link href={href} {...rest} />;
}

/*
 * Note on `<details>`/`<summary>` anchors: MDX passes literal JSX through
 * untouched — the `components` map below only applies to elements *generated*
 * from markdown — so a component override for `summary` would never fire.
 * The FAQ pages therefore carry explicit `id` attributes on each `<summary>`,
 * slugged with the same `github-slugger` algorithm that `collectHeadings` uses
 * for the search index, so deep links from search resolve.
 */

const prettyCodeOptions = {
  // `github-dark`'s comment colour (#6A737D) renders at 3.60:1 on our code
  // surface — below the 4.5:1 AA floor, and comments are the single largest
  // token class in these snippets. `github-dark-default` uses #8b949e (5.64:1).
  theme: "github-dark-default",
  keepBackground: true,
  defaultLang: "text",
};

export function Mdx({
  source,
  locale = DEFAULT_LOCALE,
}: {
  source: string;
  locale?: Locale;
}) {
  const t = UI[locale];

  const components = {
    a: MdxLink,
    img: (props: ImgHTMLAttributes<HTMLImageElement>) => (
      <DocImage {...props} enlargeLabel={t.enlargeImage} closeLabel={t.close} />
    ),
    // Fenced code blocks get a copy button.
    pre: (props: HTMLAttributes<HTMLPreElement>) => (
      <CodeBlock {...props} copyLabel={t.copy} copiedLabel={t.copied} />
    ),
    // Wide tables scroll inside a focusable container. Scrolling must NOT be put
    // on the <table> itself via `display: block` — that strips the table role in
    // several browser/AT pairings, costing screen readers row/column context.
    table: (props: TableHTMLAttributes<HTMLTableElement>) => (
      <div className="table-scroll" tabIndex={0} role="region" aria-label={props.summary ?? "Table"}>
        <table {...props} />
      </div>
    ),
    Admonition,
    Figure,
    // Dynamic content blocks referenced by JSX tags in migrated MDX.
    Chart: TokenomicsChart,
  };

  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          // No remark-math / rehype-katex: no page in any locale contains math,
          // and having them on made `$` a math delimiter — so every currency
          // figure in the content had to be hand-escaped as `\$`. Dropping them
          // removes 23 KB of KaTeX CSS from every page and lets authors write
          // `$20,000` normally. (`\$` still renders as `$`, so existing content
          // is unaffected.) Re-add both together if math is ever needed.
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [rehypePrettyCode, prettyCodeOptions],
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                properties: {
                  className: ["heading-anchor"],
                  ariaLabel: "Link to section",
                },
                content: { type: "text", value: "#" },
              },
            ],
          ],
        },
      }}
    />
  );
}
