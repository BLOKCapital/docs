import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
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

/** Internal links route through next/link; external open in a new tab. */
function MdxLink({ href = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = /^https?:\/\//.test(href) || href.startsWith("//");
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
  }
  return <Link href={href} {...rest} />;
}

/** Content images live in /public; render through next/image when possible. */
function MdxImage({ src, alt = "", ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  if (typeof src === "string" && src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={720}
        className="h-auto w-full"
        sizes="(max-width: 768px) 100vw, 720px"
        unoptimized
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src as string} alt={alt} {...rest} />;
}

const components = {
  a: MdxLink,
  img: MdxImage,
  Admonition,
  // Dynamic content blocks referenced by JSX tags in migrated MDX.
  Audit: AuditReports,
  Chart: TokenomicsChart,
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
                  arialabel: "Link to section",
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
