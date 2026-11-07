import fr, { type UIKey } from './fr';
import en from './en';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

const dictionaries: Record<Locale, Record<UIKey, string>> = { fr, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Texte d'interface dans la langue demandée. */
export function t(lang: Locale, key: UIKey): string {
  return dictionaries[lang][key];
}

/** Champ de contenu bilingue : fr obligatoire, en facultatif. */
export type Localized = { fr: string; en?: string | null | undefined };

/** Renvoie la version anglaise si elle existe, sinon le français. */
export function pick(field: Localized | null | undefined, lang: Locale): string {
  if (!field) return '';
  if (lang === 'en' && field.en && field.en.trim() !== '') return field.en;
  return field.fr;
}

/** Indique si la page anglaise affiche du français faute de traduction. */
export function isFallback(field: Localized | null | undefined, lang: Locale): boolean {
  return lang === 'en' && !!field && !(field.en && field.en.trim() !== '');
}

/* Pages du site et leurs adresses par langue. */
export const pageKeys = [
  'home', 'about', 'projects', 'activities', 'zones', 'news', 'events', 'gallery',
  'reports', 'offers', 'partners', 'faq', 'contact',
] as const;
export type PageKey = (typeof pageKeys)[number];
export type SectionKey = Exclude<PageKey, 'home'>;

export const slugs: Record<Locale, Record<SectionKey, string>> = {
  fr: {
    about: 'a-propos', projects: 'projets', activities: 'activites', zones: 'zones-intervention', news: 'actualites',
    events: 'evenements', gallery: 'galerie', reports: 'publications', offers: 'offres',
    partners: 'partenaires', faq: 'faq', contact: 'contact',
  },
  en: {
    about: 'about', projects: 'projects', activities: 'activities', zones: 'areas', news: 'news',
    events: 'events', gallery: 'gallery', reports: 'publications', offers: 'opportunities',
    partners: 'partners', faq: 'faq', contact: 'contact',
  },
};

export const navLabel: Record<PageKey, UIKey> = {
  home: 'nav.home', about: 'nav.about', projects: 'nav.projects', activities: 'nav.activities', zones: 'nav.zones',
  news: 'nav.news', events: 'nav.events', gallery: 'nav.gallery', reports: 'nav.reports',
  offers: 'nav.offers', partners: 'nav.partners', faq: 'nav.faq', contact: 'nav.contact',
};

/** Adresse d'une page dans une langue, avec barre finale. */
export function pagePath(lang: Locale, key: PageKey): string {
  if (key === 'home') return `/${lang}/`;
  return `/${lang}/${slugs[lang][key]}/`;
}

/** Retrouve la clé de page à partir d'un slug. */
export function keyFromSlug(lang: Locale, slug: string): SectionKey | undefined {
  const entry = Object.entries(slugs[lang]).find(([, s]) => s === slug);
  return entry ? (entry[0] as SectionKey) : undefined;
}

/* Menu mobile : toutes les pages. Menu ordinateur : 7 entrées.
   Événements et Galerie sont rattachés à Actualités, Partenaires et FAQ à À propos. */
export const mobileNav: readonly PageKey[] = pageKeys.filter((k) => k !== 'activities');
export const desktopNav: readonly PageKey[] = ['about', 'projects', 'zones', 'news', 'reports', 'offers', 'contact'];
export const navGroup: Partial<Record<PageKey, PageKey>> = {
  events: 'news', gallery: 'news', partners: 'about', faq: 'about', activities: 'projects',
};
export const footerNav: readonly { key: PageKey; label: UIKey }[] = [
  { key: 'reports', label: 'footer.reportsLong' },
  { key: 'offers', label: 'nav.offers' },
  { key: 'partners', label: 'nav.partners' },
  { key: 'faq', label: 'nav.faq' },
  { key: 'contact', label: 'nav.contact' },
];

/** Adresse d'une page de détail. */
export function detailPath(lang: Locale, key: SectionKey, slug: string): string {
  return `/${lang}/${slugs[lang][key]}/${slug}/`;
}

/** Date lisible dans la langue de la page. */
export function formatDate(d: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(d);
}
