import { getCollection, getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { Locale } from '../i18n';

type Editable = Exclude<CollectionKey, 'reglages' | 'contenus'>;

/** Éléments publiés d'une collection. Les brouillons (case « Publié » décochée) ne sortent jamais. */
export async function publies<C extends Editable>(collection: C): Promise<CollectionEntry<C>[]> {
  const all = (await getCollection(collection)) as CollectionEntry<C>[];
  return all.filter((e) => (e.data as { publie: boolean }).publie);
}

/** Texte libre d'un élément dans la langue demandée, avec repli sur le français.
 *  Renvoie null si aucun texte n'est écrit (rien ne s'affiche alors). */
export async function contenu(
  collection: Editable,
  slug: string,
  lang: Locale,
): Promise<{ entry: CollectionEntry<'contenus'>; repli: boolean } | null> {
  const nonVide = (e: CollectionEntry<'contenus'> | undefined) =>
    e && (e.body ?? '').trim() !== '' ? e : undefined;
  if (lang === 'en') {
    const en = nonVide(await getEntry('contenus', `${collection}/${slug}/en`));
    if (en) return { entry: en, repli: false };
  }
  const fr = nonVide(await getEntry('contenus', `${collection}/${slug}/fr`));
  return fr ? { entry: fr, repli: lang === 'en' } : null;
}

/** Tri par ordre d'affichage (vide = à la fin), puis par titre ou nom. */
export function parOrdre<T extends { data: { ordre: number | null } }>(items: T[], libelle: (i: T) => string): T[] {
  return [...items].sort((a, b) => {
    const oa = a.data.ordre ?? Number.MAX_SAFE_INTEGER;
    const ob = b.data.ordre ?? Number.MAX_SAFE_INTEGER;
    return oa !== ob ? oa - ob : libelle(a).localeCompare(libelle(b), 'fr');
  });
}

/** Tri du plus récent au plus ancien. */
export function parDateDesc<T>(items: T[], date: (i: T) => Date | null): T[] {
  return [...items].sort((a, b) => (date(b)?.getTime() ?? 0) - (date(a)?.getTime() ?? 0));
}

/** Date du jour à Goma (UTC+2), au format AAAA-MM-JJ. */
function aujourdhuiGoma(maintenant = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lubumbashi' }).format(maintenant);
}

/** Une offre est clôturée le lendemain de sa date limite (heure de Goma). Sans date : ouverte. */
export function estCloturee(dateLimite: Date | null, maintenant = new Date()): boolean {
  if (!dateLimite) return false;
  return dateLimite.toISOString().slice(0, 10) < aujourdhuiGoma(maintenant);
}

/** Offres publiées, réparties en cours / clôturées, triées de la plus récente à la plus ancienne. */
export async function offresParEtat() {
  const toutes = await publies('offres');
  const enCours = toutes.filter((o) => !estCloturee(o.data.dateLimite));
  const cloturees = toutes.filter((o) => estCloturee(o.data.dateLimite));
  return {
    // En cours : la date limite la plus proche d'abord, les offres sans date ensuite.
    enCours: [...enCours].sort(
      (a, b) => (a.data.dateLimite?.getTime() ?? Infinity) - (b.data.dateLimite?.getTime() ?? Infinity),
    ),
    cloturees: parDateDesc(cloturees, (o) => o.data.dateLimite),
  };
}

/** Titre dans la langue demandée (repli sur le français). */
export function titreDe(data: { titre: string; titreEn: string }, lang: Locale): string {
  return lang === 'en' && data.titreEn.trim() !== '' ? data.titreEn : data.titre;
}
