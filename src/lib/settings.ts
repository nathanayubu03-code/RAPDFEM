import { getEntry, type CollectionEntry } from 'astro:content';

// Réglages du site, édités dans Keystatic (Réglages du site).
// Aucun champ pour des coordonnées bancaires, volontairement.

export type SiteSettings = CollectionEntry<'reglages'>['data'];

let cache: SiteSettings | undefined;

export async function getSettings(): Promise<SiteSettings> {
  if (cache) return cache;
  const entry = await getEntry('reglages', 'site');
  if (!entry) throw new Error('Réglages du site introuvables : src/content/reglages/site.json');
  cache = entry.data;
  return cache;
}

/** Numéro au format tel: (chiffres et + uniquement). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
