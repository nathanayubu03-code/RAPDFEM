import { getEntry, type CollectionEntry } from 'astro:content';

export type Presentation = CollectionEntry<'presentation'>['data'];
let cache: Presentation | undefined;

/** Contenu de présentation (accueil, à propos, transparence), édité dans Keystatic. */
export async function getPresentation(): Promise<Presentation> {
  if (cache) return cache;
  const entry = await getEntry('presentation', 'site');
  if (!entry) throw new Error('Présentation introuvable : src/content/presentation/site.json');
  cache = entry.data;
  return cache;
}
