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
import { SectionIndex } from "@/components/docs/SectionIndex";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { PrevNext } from "@/components/docs/PrevNext";
import { Breadcrumbs, type Crumb } from "@/components/docs/Breadcrumbs";

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
  if (isSectionRoot(slug)) {
    return {
      title: UI[locale].sections[slug[0]],
      description: SECTION_BLURB[locale][slug[0]],
    };
  }
  const doc = getDoc(locale, slug);
  if (!doc) return {};
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
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

  return (
    <div className="paper relative isolate">
      <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 sm:px-6">
        {/* Left sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-2">
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
              <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
            <div aria-hidden className="rule-hand my-7" />
            {doc ? (
              <>
                <div className="doc-prose">
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
              <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-10">
                <TableOfContents items={toc} label={t.onThisPage} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
