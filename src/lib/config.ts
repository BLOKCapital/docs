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
  },
};

export const EXTERNAL = {
  whitepaper: "https://docsend.com/view/4j6qvvrudyr6izyb",
  github: "https://github.com/BLOKCapital",
  discord: "https://discord.com/invite/blokc",
  telegram: "https://t.me/BLOKCapital",
  x: "https://x.com/blok_cap",
  site: "https://blokcapital.io",
} as const;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
