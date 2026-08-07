import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getAllDocParams,
  getDoc,
  getSectionNav,
  getSectionEntry,
  flattenNav,
  duplicatesLede,
  localesWithDoc,
} from "@/lib/content";
import { extractToc } from "@/lib/toc";
import {
  isLocale,
  LOCALES,
  SECTIONS,
  UI,
  type Locale,
  type SectionSlug,
} from "@/lib/config";
import { Mdx } from "@/components/docs/Mdx";
import { Sidebar } from "@/components/docs/Sidebar";
import { DocNavRegistrar } from "@/components/docs/DocNavContext";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { PrevNext } from "@/components/docs/PrevNext";
import { DocMeta } from "@/components/docs/DocMeta";
import { Breadcrumbs, type Crumb } from "@/components/docs/Breadcrumbs";
import {
  JsonLd,
  absoluteUrl,
  alternatesFor,
  canonicalFor,
  articleLd,
  breadcrumbLd,
  faqLd,
  extractFaq,
  excerpt,
  ogLocale,
  OG_IMAGE,
} from "@/lib/seo";

/**
 * Unknown paths 404 at the routing layer and are served the prerendered
 * `/_not-found` page.
 *
 * Do not flip this to `true` to try to route 404s through a nested
 * `[locale]/not-found.tsx`: `<html>`/`<body>` live in `[locale]/layout.tsx`, and
 * Next renders a `notFound()` boundary under the *root* layout — which here is a
 * pass-through with no document shell. The result is Next's bare
 * `__next_error__` shell with an empty server-rendered body. Keeping this
 * `false` keeps the 404 statically prerendered and server-rendered; the chrome
 * it needs is carried by `NotFoundContent` instead.
 */
export const dynamicParams = false;

const SECTION_SLUGS = SECTIONS.map((s) => s.slug) as SectionSlug[];

function isSectionRoot(slug: string[]): slug is [SectionSlug] {
  return slug.length === 1 && SECTION_SLUGS.includes(slug[0] as SectionSlug);
}

export function generateStaticParams() {
  // Doc pages, plus each section root — which is prerendered purely as a
  // redirect to the section's first doc. The routes are kept (rather than
  // deleted) so existing inbound links and anything already indexed at
  // `/<locale>/<section>` land on real content instead of a 404.
  const sectionParams = LOCALES.flatMap((locale) =>
    SECTION_SLUGS.map((slug) => ({ locale, slug: [slug] })),
  );
  return [...sectionParams, ...getAllDocParams()];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const pathAfterLocale = slug.join("/");

  // Section roots only redirect — no metadata to emit, and marking them
  // noindex keeps the redirect out of the index rather than having it compete
  // with the page it points at.
  if (isSectionRoot(slug)) {
    return { robots: { index: false, follow: true } };
  }

  const doc = getDoc(locale, slug);
  if (!doc) return {};
  const title = doc.frontmatter.title;
  // Fall back to a generated excerpt when frontmatter omits a description so
  // every page ships a real meta description (CTR + answer-engine snippets).
  const description =
    doc.frontmatter.description?.trim() || excerpt(doc.body);

  return {
    title,
    description,
    keywords: [title, UI[locale].sections[doc.section], "BLOK Capital"],
    // Only claim the locales this page is actually translated into.
    alternates: alternatesFor(
      locale,
      pathAfterLocale,
      localesWithDoc(pathAfterLocale),
    ),
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalFor(locale, pathAfterLocale),
      images: [OG_IMAGE],
      ...ogLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = UI[loc];

  const section = slug[0] as SectionSlug;

  // `/<locale>/<section>` carries no content of its own — send it to the
  // section's first doc so the URL resolves to a real page.
  if (isSectionRoot(slug)) redirect(getSectionEntry(loc, section));

  const doc = getDoc(loc, slug);
  if (!doc) notFound();

  const nav = getSectionNav(loc, section);
  const flat = flattenNav(nav);
  const toc = extractToc(doc.body);
  const sectionEntry = getSectionEntry(loc, section);

  const idx = flat.findIndex((d) => d.href === doc.href);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  const title = doc.frontmatter.title;
  // Keep the description in <meta> regardless, but don't print it above a body
  // that already opens with the same words.
  const description =
    doc.frontmatter.description &&
    duplicatesLede(doc.frontmatter.description, doc.body)
      ? undefined
      : doc.frontmatter.description;

  // The section crumb points at the section's entry doc, not at the redirecting
  // section root, so following it costs no extra hop.
  const crumbs: Crumb[] = [{ label: t.sections[section], href: sectionEntry }];
  if (slug.length > 1) crumbs.push({ label: doc.frontmatter.title });

  // Structured data: a breadcrumb trail plus a TechArticle (FAQPage when the
  // page is a Q&A list).
  const pageUrl = canonicalFor(loc, slug.join("/"));
  const metaDescription =
    doc.frontmatter.description?.trim() || excerpt(doc.body);

  const structuredData: Record<string, unknown>[] = [
    breadcrumbLd([
      { name: t.sections[section], url: absoluteUrl(sectionEntry) },
      ...(slug.length > 1 ? [{ name: title, url: pageUrl }] : []),
    ]),
  ];

  const faq = /faq/i.test(slug.join("/")) ? extractFaq(doc.body) : [];
  structuredData.push(
    faq.length
      ? faqLd(faq)
      : articleLd({
          title,
          description: metaDescription || title,
          url: pageUrl,
          locale: loc,
          section: t.sections[section],
        }),
  );

  // Path relative to the repo root, for the "Edit this page" link.
  const editPath = doc.filePath.slice(doc.filePath.indexOf("content/"));

  return (
    <div className="paper relative isolate">
      <JsonLd data={structuredData} />
      {/* Publishes this page's nav + TOC to the sticky header, which is where
          the mobile "Menu" control lives. */}
      <DocNavRegistrar nav={nav} toc={toc} />
      <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 sm:px-6">
        {/* Left sidebar — subtle vertical rule separates nav from content.
            sidebar-fade masks the top/bottom edges so items glide behind the
            translucent navbar instead of butting up against it. */}
        <aside className="hidden w-60 shrink-0 border-r border-ink/10 lg:block">
          <div className="sidebar-fade sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto pb-10 pr-4 pt-7">
            <Sidebar nav={nav} />
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 gap-10 py-10">
          <article className="min-w-0 flex-1">
            <Breadcrumbs items={crumbs} />
            <h1 className="display text-[34px] leading-[1.1] text-ink sm:text-[40px]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-prose text-[17px] leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
            <div aria-hidden className="rule-hand my-7" />
            {/* `max-w-prose` (72ch) caps the measure. Unconstrained, the column
                ran to ~950px — about 115 characters per line, well past the
                45–75 that stays comfortable to read. */}
            <div className="doc-prose max-w-prose" data-slug={slug.join("/")}>
              <Mdx source={doc.body} locale={loc} />
            </div>
            <div className="max-w-prose">
              <DocMeta
                locale={loc}
                updatedAt={doc.updatedAt}
                editPath={editPath}
              />
              <PrevNext
                prev={prev}
                next={next}
                prevLabel={t.previous}
                nextLabel={t.next}
              />
            </div>
          </article>

          {/* Right TOC rail. Rendered only when there are headings to list —
              eight pages have none, and an always-on rail reserved 224px of
              empty gutter on each of them. */}
          {toc.length > 0 && (
            <aside className="hidden w-56 shrink-0 xl:block">
              <div className="sidebar-fade sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto pb-10 pt-7">
                <TableOfContents items={toc} label={t.onThisPage} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
