import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { ImgHTMLAttributes, AnchorHTMLAttributes } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { Admonition } from "@/components/docs/Admonition";
import { AuditReports } from "@/components/docs/AuditReports";
import { TokenomicsChart } from "@/components/docs/TokenomicsChart";
import { Mermaid } from "@/components/docs/Mermaid";
import * as Diagrams from "@/components/docs/diagrams";

/** Internal links route through next/link; external open in a new tab. */
function MdxLink({ href = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = /^https?:\/\//.test(href) || href.startsWith("//");
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
  }
  return <Link href={href} {...rest} />;
}

/**
 * Content images live in /public with arbitrary, unknown dimensions, so we
 * render a plain lazy <img> rather than next/image — which would require fixed
 * width/height and distort non-16:10 art. Browser-native lazy loading keeps
 * off-screen images cheap.
 */
function MdxImage({ src, alt = "", ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src as string}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-auto w-full"
      {...rest}
    />
  );
}

const components = {
  a: MdxLink,
  img: MdxImage,
  Admonition,
  // Dynamic content blocks referenced by JSX tags in migrated MDX.
  Audit: AuditReports,
  Chart: TokenomicsChart,
  // Themed diagrams (replaced the former /img/*.png|jpg raster diagrams).
  Mermaid,
  ...Diagrams,
};

const prettyCodeOptions = {
  theme: "github-dark",
  keepBackground: true,
  defaultLang: "text",
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeSlug,
            [rehypeKatex, { strict: false }],
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
