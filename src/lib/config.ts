/**
 * Site-wide configuration: locales, the four documentation sections, and
 * external links. Sections map 1:1 to the original Docusaurus content areas.
 */

export const SITE = {
  name: "BLOK Capital Docs",
  /** Short brand name used in titles / structured data. */
  brand: "BLOK Capital",
  url: "https://docs.blokcapital.io",
  siteUrl: "https://blokcapital.io",
  tagline: "Decentralized wealth management, documented.",
  /**
   * Longer, entity-rich description used as the default meta description and
   * for AI/answer-engine summaries. Names the primary entities a crawler
   * should associate with the brand.
   */
  description:
    "Official documentation for BLOK Capital, a non-custodial, on-chain wealth management protocol on EVM chains. Learn the Diamond (EIP-2535) architecture, account abstraction, Gardens, facets, oracles, tokenomics, governance, and how to build on the protocol.",
} as const;

/**
 * Organization / brand entity used for JSON-LD (Organization, WebSite) and
 * for knowledge-graph / answer-engine recognition. `sameAs` links the entity
 * to its authoritative profiles across the web.
 */
export const ORG = {
  name: "BLOK Capital",
  legalName: "BLOK Capital DAO LLC",
  logo: `${SITE.url}/brand/blokc-black.svg`,
  sameAs: [
    "https://blokcapital.io",
    "https://github.com/BLOKCapital",
    "https://x.com/blok_cap",
    "https://discord.com/invite/blokc",
    "https://t.me/BLOKCapital",
  ],
} as const;

/** X/Twitter handle for `twitter:site` / `twitter:creator`. */
export const TWITTER_HANDLE = "@blok_cap";

/**
 * Broad, brand- and topic-level keywords. Per-page keywords are derived from
 * frontmatter + section context; these anchor the site's topical authority.
 * Kept lean; keyword stuffing hurts more than it helps in 2026.
 */
export const SITE_KEYWORDS = [
  "BLOK Capital",
  "decentralized wealth management",
  "non-custodial asset management",
  "on-chain wealth management",
  "Diamond proxy",
  "EIP-2535",
  "account abstraction",
  "smart contract wallet",
  "DeFi protocol documentation",
  "crypto index funds",
  "DAO governance",
] as const;

/** BCP-47 / Open Graph locale codes per supported language. */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
};

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
    lastUpdated: string;
    menu: string;
    footer: {
      tagline: string;
      blurb: string;
      protocol: string;
      community: string;
      website: string;
      whitepaper: string;
    };
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
    lastUpdated: "Last updated",
    menu: "Menu",
    footer: {
      tagline: "It's crypto, but different.",
      blurb:
        "Documentation for the BLOK Capital protocol concepts, smart contracts, builder guides, and resources.",
      protocol: "Protocol",
      community: "Community",
      website: "Website",
      whitepaper: "Whitepaper",
    },
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
    lastUpdated: "Última actualización",
    menu: "Menú",
    footer: {
      tagline: "Cripto, pero diferente.",
      blurb:
        "Documentación de los conceptos del protocolo BLOK Capital, contratos inteligentes, guías para desarrolladores y recursos.",
      protocol: "Protocolo",
      community: "Comunidad",
      website: "Sitio web",
      whitepaper: "Whitepaper",
    },
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
    lastUpdated: "Dernière mise à jour",
    menu: "Menu",
    footer: {
      tagline: "La crypto, autrement.",
      blurb:
        "Documentation des concepts du protocole BLOK Capital, des contrats intelligents, des guides pour développeurs et des ressources.",
      protocol: "Protocole",
      community: "Communauté",
      website: "Site web",
      whitepaper: "Livre blanc",
    },
  },
};

/** Short, localized one-liners describing each section (home + section landing). */
export const SECTION_BLURB: Record<Locale, Record<SectionSlug, string>> = {
  en: {
    concepts: "Protocol fundamentals: account abstraction, Diamonds, oracles, and wealth management.",
    "smart-contracts": "The V1 on-chain architecture: entry points, facets, the registry, and indices.",
    builders: "Hands-on guides for building on BLOK Capital: Gardens, facets, and governance.",
    resources: "Tokenomics, audits, FAQs, brand assets, and contract addresses.",
  },
  es: {
    concepts: "Fundamentos del protocolo: abstracción de cuentas, Diamonds, oráculos y gestión patrimonial.",
    "smart-contracts": "La arquitectura on-chain de V1: puntos de entrada, facets, el registro e índices.",
    builders: "Guías prácticas para construir sobre BLOK Capital: Gardens, facets y gobernanza.",
    resources: "Tokenomics, auditorías, preguntas frecuentes, recursos de marca y direcciones de contratos.",
  },
  fr: {
    concepts: "Fondamentaux du protocole : abstraction de compte, Diamonds, oracles et gestion de patrimoine.",
    "smart-contracts": "L'architecture on-chain V1 : points d'entrée, facets, le registre et les index.",
    builders: "Guides pratiques pour construire sur BLOK Capital : Gardens, facets et gouvernance.",
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
