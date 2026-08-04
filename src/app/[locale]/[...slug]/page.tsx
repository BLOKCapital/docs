import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllDocParams,
  getDoc,
  getSectionNav,
  flattenNav,
} from "@/lib/content";
import { extractToc } from "@/lib/toc";
import {
  isLocale,
  LOCALES,
  SECTIONS,
  SECTION_BLURB,
  UI,
  type Locale,
  type SectionSlug,
} from "@/lib/config";
import { Mdx } from "@/components/docs/Mdx";
import { Sidebar } from "@/components/docs/Sidebar";
import { MobileNav } from "@/components/docs/MobileNav";
import { SectionIndex } from "@/components/docs/SectionIndex";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { PrevNext } from "@/components/docs/PrevNext";
import { Breadcrumbs, type Crumb } from "@/components/docs/Breadcrumbs";
import {
  JsonLd,
  alternatesFor,
  canonicalFor,
  articleLd,
  breadcrumbLd,
  collectionPageLd,
  faqLd,
  extractFaq,
  excerpt,
  ogLocale,
  OG_IMAGE,
} from "@/lib/seo";

export const dynamicParams = false;

const SECTION_SLUGS = SECTIONS.map((s) => s.slug) as SectionSlug[];

function isSectionRoot(slug: string[]): slug is [SectionSlug] {
  return slug.length === 1 && SECTION_SLUGS.includes(slug[0] as SectionSlug);
}

export function generateStaticParams() {
  // Doc pages + a landing page for each section root (`/<locale>/<section>`).
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

  if (isSectionRoot(slug)) {
    const title = UI[locale].sections[slug[0]];
    const description = SECTION_BLURB[locale][slug[0]];
    return {
      title,
      description,
      alternates: alternatesFor(locale, pathAfterLocale),
      openGraph: {
        type: "website",
        title,
        description,
        url: canonicalFor(locale, pathAfterLocale),
        images: [OG_IMAGE],
        ...ogLocale(locale),
      },
    };
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
    alternates: alternatesFor(locale, pathAfterLocale),
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
  const sectionRoot = isSectionRoot(slug);

  const doc = sectionRoot ? null : getDoc(loc, slug);
  if (!doc && !sectionRoot) notFound();

  const nav = getSectionNav(loc, section);
  const flat = flattenNav(nav);
  const toc = doc ? extractToc(doc.body) : [];

  const idx = doc ? flat.findIndex((d) => d.href === doc.href) : -1;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  // Section landing: title/blurb come from config; doc pages use frontmatter.
  const title = doc ? doc.frontmatter.title : t.sections[section];
  const description = doc
    ? doc.frontmatter.description
    : SECTION_BLURB[loc][section];

  const crumbs: Crumb[] = [
    { label: t.sections[section], href: `/${loc}/${section}` },
  ];
  if (doc && slug.length > 1) crumbs.push({ label: doc.frontmatter.title });

  // Structured data: a breadcrumb trail on every page, plus a TechArticle for
  // doc pages (FAQPage when the page is a Q&A list) or a CollectionPage for
  // section landings.
  const pageUrl = canonicalFor(loc, slug.join("/"));
  const metaDescription = doc
    ? doc.frontmatter.description?.trim() || excerpt(doc.body)
    : description;

  const structuredData: Record<string, unknown>[] = [
    breadcrumbLd([
      { name: t.home, url: canonicalFor(loc, "") },
      { name: t.sections[section], url: canonicalFor(loc, section) },
      ...(doc && slug.length > 1 ? [{ name: title, url: pageUrl }] : []),
    ]),
  ];

  if (doc) {
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
  } else {
    structuredData.push(
      collectionPageLd({
        name: title,
        description: description || title,
        url: pageUrl,
        locale: loc,
      }),
    );
  }

  return (
    <div className="paper relative isolate">
      <JsonLd data={structuredData} />
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
            <div className="mb-4 lg:hidden">
              <MobileNav
                nav={nav}
                toc={toc}
                menuLabel={t.menu}
                onThisPage={t.onThisPage}
              />
            </div>
            <Breadcrumbs items={crumbs} />
            <h1 className="display text-[34px] leading-[1.1] text-ink sm:text-[40px]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
            <div aria-hidden className="rule-hand my-7" />
            {doc ? (
              <>
                <div className="doc-prose" data-slug={slug.join("/")}>
                  <Mdx source={doc.body} />
                </div>
                <PrevNext
                  prev={prev}
                  next={next}
                  prevLabel={t.previous}
                  nextLabel={t.next}
                />
              </>
            ) : (
              <SectionIndex nav={nav} />
            )}
          </article>

          {/* Right TOC rail — only for doc pages with headings */}
          {doc && (
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
