import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isLocale,
  SECTIONS,
  SECTION_BLURB,
  UI,
  SITE,
  type Locale,
} from "@/lib/config";
import { getSectionNav, flattenNav } from "@/lib/content";
import {
  JsonLd,
  alternatesFor,
  canonicalFor,
  collectionPageLd,
  ogLocale,
  OG_IMAGE,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = `${SITE.name}: Decentralized Wealth Management Protocol`;
  return {
    // Absolute so the home title isn't wrapped by the "%s · …" template.
    title: { absolute: title },
    description: SITE.description,
    alternates: alternatesFor(locale, ""),
    openGraph: {
      title,
      description: SITE.description,
      url: canonicalFor(locale, ""),
      images: [OG_IMAGE],
      ...ogLocale(locale),
    },
  };
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = UI[loc];

  return (
    <div className="paper relative isolate">
      <JsonLd
        data={collectionPageLd({
          name: `${SITE.name}: Decentralized Wealth Management Protocol`,
          description: SITE.description,
          url: canonicalFor(loc, ""),
          locale: loc,
        })}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 38% at 50% 0%, rgb(var(--clay) / 0.06), transparent 65%), radial-gradient(40% 30% at 88% 6%, rgb(var(--moss) / 0.05), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-5xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <p className="eyebrow text-moss">Documentation</p>
        <h1 className="display mt-3 text-[40px] leading-[1.04] text-ink sm:text-[56px]">
          {SITE.name}
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-muted">
          {SITE.tagline} Choose a section to begin.
        </p>

        <div aria-hidden className="rule-hand my-10" />

        <div className="grid gap-5 sm:grid-cols-2">
          {SECTIONS.map((s) => {
            const count = flattenNav(getSectionNav(loc, s.slug)).length;
            return (
              <Link
                key={s.slug}
                href={`/${loc}/${s.slug}`}
                className="group/c flex flex-col rounded-2xl border border-ink/10 bg-paper-warm p-6 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-moss/30 hover:bg-moss/[0.04]"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="display text-[22px] text-ink">{t.sections[s.slug]}</h2>
                  <span className="text-clay transition-transform duration-200 group-hover/c:translate-x-1">
                    →
                  </span>
                </div>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-muted">
                  {SECTION_BLURB[loc][s.slug]}
                </p>
                {count > 0 && (
                  <span className="mt-4 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                    {count} {count === 1 ? "page" : "pages"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
