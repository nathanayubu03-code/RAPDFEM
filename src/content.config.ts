import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Ces collections lisent directement les fichiers écrits par Keystatic (keystatic.config.ts).
// Aucune donnée n'est dupliquée : chaque élément est un dossier src/content/<collection>/<slug>/
// avec index.yaml (les champs) et contenuFr.mdoc / contenuEn.mdoc (le texte libre).

/* Champs communs */

const texte = z.string().nullish().transform((v) => v ?? '');

/** Texte bilingue : fr obligatoire, en facultatif. */
export const bilingue = z.object({ fr: texte, en: texte });
/** Texte bilingue entièrement facultatif. */
export const bilingueFacultatif = z
  .object({ fr: texte, en: texte })
  .nullish()
  .transform((v) => v ?? { fr: '', en: '' });

/** Image optimisée par Astro + texte alternatif.
 *  Robuste : un texte alternatif oublié ne bloque jamais la publication ;
 *  le site utilise alors le titre de l'élément (voir altOu dans lib/contenu.ts). */
export const imageAvecAlt = ({ image }: SchemaContext, _champ: string) =>
  z
    .object({
      image: image().nullish().transform((v) => v ?? null),
      alt: bilingueFacultatif,
    })
    .nullish()
    .transform((v) => v ?? { image: null, alt: { fr: '', en: '' } });

const publie = z.boolean().default(false);
const date = z.coerce.date().nullish().transform((v) => v ?? new Date(0));
const dateFacultative = z.coerce.date().nullish().transform((v) => v ?? null);
const ordre = z.number().int().nullish().transform((v) => v ?? null);
const fichier = z.string().nullish().transform((v) => v ?? null);
/** Lien vers un autre élément. Tolérant : si l'élément lié a été supprimé, le lien est ignoré. */
const lien = (_c: 'projets' | 'rapports' | 'evenements') =>
  z.string().nullish().transform((v) => (v ? { id: v } : null));
const photos = (ctx: SchemaContext) => z.array(imageAvecAlt(ctx, 'Photo')).default([]);

/** Un élément = un dossier ; son identifiant est le nom du dossier (le slug). */
const dossier = (nom: string) =>
  glob({
    pattern: '*/index.yaml',
    base: `./src/content/${nom}`,
    generateId: ({ entry }) => entry.split('/')[0] ?? entry,
  });

/* Collections */

const reglages = defineCollection({
  loader: glob({ pattern: 'site.json', base: './src/content/reglages' }),
  schema: (ctx) =>
    z.object({
      sigle: texte,
      nom: bilingue,
      presentationCourte: bilingueFacultatif,
      descriptionSeo: bilingueFacultatif,
      logo: imageAvecAlt(ctx, 'Logo principal'),
      logoFondSombre: imageAvecAlt(ctx, 'Logo pour fond sombre'),
      favicon: fichier,
      imageOg: imageAvecAlt(ctx, 'Image de partage'),
      bureaux: z.array(z.object({ nom: bilingue, adresse: bilingue })).default([]),
      telephones: z.array(z.string()).default([]),
      courriels: z.array(z.string()).default([]),
      reseauxSociaux: z.array(z.object({ reseau: texte, url: texte })).default([]).transform((l) => l.filter((r) => r.reseau && r.url)),
    }),
});

const presentation = defineCollection({
  loader: glob({ pattern: 'site.json', base: './src/content/presentation' }),
  schema: (ctx) =>
    z.object({
      surtitre: bilingueFacultatif,
      accroche: bilingueFacultatif,
      imageAccueil: imageAvecAlt(ctx, "Photo de l'accueil"),
      chiffres: z.array(z.object({ valeur: texte, libelle: bilingue })).default([]),
      statut: bilingueFacultatif,
      mission: bilingueFacultatif,
      vision: bilingueFacultatif,
      objectif: bilingueFacultatif,
      axes: z
        .array(z.object({ titre: bilingue, texte: bilingueFacultatif, points: z.array(bilingue).default([]) }))
        .default([]),
      approches: z.array(bilingue).default([]),
      documentsLegaux: z.array(bilingue).default([]),
      politiques: z.array(z.object({ titre: bilingue, fichierPdf: fichier })).default([]),
    }),
});

const don = defineCollection({
  loader: glob({ pattern: 'site.json', base: './src/content/don' }),
  schema: z.object({
    texte: bilingueFacultatif,
    comptes: z
      .array(z.object({ banque: texte, intitule: texte, numero: texte, swift: texte, devise: texte }))
      .default([])
      .transform((l) => l.filter((c) => c.banque && c.numero)),
  }),
});

const projets = defineCollection({
  loader: dossier('projets'),
  schema: (ctx) =>
    z.object({
      titre: texte,
      titreEn: texte,
      publie,
      imagePrincipale: imageAvecAlt(ctx, 'Image principale'),
      photos: photos(ctx),
      ordre,
    }),
});

const actualites = defineCollection({
  loader: dossier('actualites'),
  schema: (ctx) =>
    z.object({
      titre: texte,
      titreEn: texte,
      publie,
      date,
      resume: bilingueFacultatif,
      imagePrincipale: imageAvecAlt(ctx, 'Image principale'),
      projetLie: lien('projets'),
    }),
});

const activites = defineCollection({
  loader: dossier('activites'),
  schema: (ctx) =>
    z.object({
      titre: texte,
      titreEn: texte,
      publie,
      date: dateFacultative,
      domaine: bilingueFacultatif,
      photos: photos(ctx),
      projetLie: lien('projets'),
      rapportLie: lien('rapports'),
    }),
});

const evenements = defineCollection({
  loader: dossier('evenements'),
  schema: (ctx) =>
    z.object({
      titre: texte,
      titreEn: texte,
      publie,
      date,
      lieu: bilingueFacultatif,
      image: imageAvecAlt(ctx, 'Image'),
    }),
});

const galerie = defineCollection({
  loader: dossier('galerie'),
  schema: (ctx) =>
    z.object({
      titre: texte,
      titreEn: texte,
      publie,
      image: imageAvecAlt(ctx, 'Photo'),
      legende: bilingueFacultatif,
      date: dateFacultative,
      projetLie: lien('projets'),
      evenementLie: lien('evenements'),
    }),
});

const offres = defineCollection({
  loader: dossier('offres'),
  schema: (ctx) =>
    z.object({
      titre: texte,
      titreEn: texte,
      publie,
      dateLimite: dateFacultative,
      photos: photos(ctx),
      fichierPdf: fichier,
    }),
});

const rapports = defineCollection({
  loader: dossier('rapports'),
  schema: z.object({
    titre: texte,
    titreEn: texte,
    publie,
    annee: z.number().int().nullish().transform((v) => v ?? 0),
    type: bilingueFacultatif,
    fichierPdf: fichier,
    resume: bilingueFacultatif,
  }),
});

const partenaires = defineCollection({
  loader: dossier('partenaires'),
  schema: (ctx) =>
    z.object({
      nom: texte,
      nomEn: texte,
      publie,
      logo: imageAvecAlt(ctx, 'Logo'),
      siteWeb: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : null)),
      categorie: bilingueFacultatif,
      ordre,
    }),
});

const equipe = defineCollection({
  loader: dossier('equipe'),
  schema: (ctx) =>
    z.object({
      nom: texte,
      publie,
      fonction: bilingue,
      bio: bilingueFacultatif,
      photo: imageAvecAlt(ctx, 'Photo'),
      ordre,
    }),
});

const zones = defineCollection({
  loader: dossier('zones'),
  schema: z.object({
    nom: texte,
    nomEn: texte,
    publie,
    province: texte,
    territoire: bilingueFacultatif,
    antennes: z.array(bilingue).default([]),
    description: bilingueFacultatif,
    ordre,
  }),
});

const faq = defineCollection({
  loader: dossier('faq'),
  schema: z.object({
    question: texte,
    questionEn: texte,
    publie,
    reponse: bilingue,
    categorie: bilingueFacultatif,
    ordre,
  }),
});

/** Textes libres (contenuFr.mdoc, contenuEn.mdoc) de toutes les collections.
 *  Identifiant : <collection>/<slug>/<fr|en>. */
const contenus = defineCollection({
  loader: glob({
    pattern: '*/*/contenu{Fr,En}.mdoc',
    base: './src/content',
    generateId: ({ entry }) => {
      const [col, slug, file] = entry.split('/');
      return `${col}/${slug}/${file === 'contenuEn.mdoc' ? 'en' : 'fr'}`;
    },
  }),
});

export const collections = {
  reglages, presentation, don, projets, actualites, activites, evenements, galerie,
  offres, rapports, partenaires, equipe, zones, faq, contenus,
};
