import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, SECTIONS, UI, SITE, type Locale } from "@/lib/config";
import { getSectionNav, flattenNav } from "@/lib/content";

const SECTION_BLURB: Record<Locale, Record<string, string>> = {
  en: {
    concepts: "Protocol fundamentals — account abstraction, Diamonds, oracles, and wealth management.",
    "smart-contracts": "The V1 on-chain architecture: entry points, facets, the registry, and indices.",
    builders: "Hands-on guides for building on BLOK Capital — Gardens, facets, and governance.",
    resources: "Tokenomics, audits, FAQs, brand assets, and contract addresses.",
  },
  es: {
    concepts: "Fundamentos del protocolo — abstracción de cuentas, Diamonds, oráculos y gestión patrimonial.",
    "smart-contracts": "La arquitectura on-chain de V1: puntos de entrada, facets, el registro e índices.",
    builders: "Guías prácticas para construir sobre BLOK Capital — Gardens, facets y gobernanza.",
    resources: "Tokenomics, auditorías, preguntas frecuentes, recursos de marca y direcciones de contratos.",
  },
  fr: {
    concepts: "Fondamentaux du protocole — abstraction de compte, Diamonds, oracles et gestion de patrimoine.",
    "smart-contracts": "L'architecture on-chain V1 : points d'entrée, facets, le registre et les index.",
    builders: "Guides pratiques pour construire sur BLOK Capital — Gardens, facets et gouvernance.",
    resources: "Tokenomics, audits, FAQ, ressources de marque et adresses de contrats.",
  },
};

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
            const nav = getSectionNav(loc, s.slug);
            const first = flattenNav(nav)[0];
            const href = first?.href ?? `/${loc}/${s.slug}`;
            const count = flattenNav(nav).length;
            return (
              <Link
                key={s.slug}
                href={href}
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
