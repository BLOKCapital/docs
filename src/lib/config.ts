/**
 * Site-wide configuration: locales, the four documentation sections, and
 * external links. Sections map 1:1 to the original Docusaurus content areas.
 */

export const SITE = {
  name: "BLOK Capital Docs",
  url: "https://docs.blokcapital.io",
  siteUrl: "https://blokcapital.io",
  tagline: "Decentralized wealth management, documented.",
} as const;

export const LOCALES = ["en", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

/**
 * Top-level sections. `dir` is the folder under content/<locale>/.
 * `label` is shown in the section switcher; localized labels live in
 * the per-locale UI dictionary below.
 */
export const SECTIONS = [
  { slug: "concepts", dir: "concepts" },
  { slug: "smart-contracts", dir: "smart-contracts" },
  { slug: "builders", dir: "builders" },
  { slug: "resources", dir: "resources" },
] as const;

export type SectionSlug = (typeof SECTIONS)[number]["slug"];

/** UI strings, per locale. Kept tiny — content itself is translated in MDX. */
export const UI: Record<
  Locale,
  {
    sections: Record<SectionSlug, string>;
    search: string;
    searchPlaceholder: string;
    onThisPage: string;
    previous: string;
    next: string;
    noResults: string;
    editPage: string;
    home: string;
    helpTranslate: string;
  }
> = {
  en: {
    sections: {
      concepts: "Concepts",
      "smart-contracts": "Smart Contracts",
      builders: "Builders",
      resources: "Resources",
    },
    search: "Search",
    searchPlaceholder: "Search the docs…",
    onThisPage: "On this page",
    previous: "Previous",
    next: "Next",
    noResults: "No results found",
    editPage: "Edit this page",
    home: "Home",
    helpTranslate: "Help us translate",
  },
  es: {
    sections: {
      concepts: "Conceptos",
      "smart-contracts": "Contratos Inteligentes",
      builders: "Desarrolladores",
      resources: "Recursos",
    },
    search: "Buscar",
    searchPlaceholder: "Buscar en la documentación…",
    onThisPage: "En esta página",
    previous: "Anterior",
    next: "Siguiente",
    noResults: "No se encontraron resultados",
    editPage: "Editar esta página",
    home: "Inicio",
    helpTranslate: "Ayúdanos a traducir",
  },
  fr: {
    sections: {
      concepts: "Concepts",
      "smart-contracts": "Smart Contracts",
      builders: "Développeurs",
      resources: "Ressources",
    },
    search: "Rechercher",
    searchPlaceholder: "Rechercher dans la documentation…",
    onThisPage: "Sur cette page",
    previous: "Précédent",
    next: "Suivant",
    noResults: "Aucun résultat trouvé",
    editPage: "Modifier cette page",
    home: "Accueil",
    helpTranslate: "Aidez-nous à traduire",
  },
};

/** Short, localized one-liners describing each section (home + section landing). */
export const SECTION_BLURB: Record<Locale, Record<SectionSlug, string>> = {
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

export const EXTERNAL = {
  whitepaper: "https://docsend.com/view/4j6qvvrudyr6izyb",
  github: "https://github.com/BLOKCapital",
  githubDocs: "https://github.com/BLOKCapital/docs",
  discord: "https://discord.com/invite/blokc",
  telegram: "https://t.me/BLOKCapital",
  x: "https://x.com/blok_cap",
  site: "https://blokcapital.io",
} as const;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
