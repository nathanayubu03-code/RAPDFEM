import { defineCollection, reference, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Ces collections lisent directement les fichiers écrits par Keystatic (keystatic.config.ts).
// Aucune donnée n'est dupliquée : chaque élément est un dossier src/content/<collection>/<slug>/
// avec index.yaml (les champs) et contenuFr.mdoc / contenuEn.mdoc (le texte libre).

/* Champs communs */

const texte = z.string().nullish().transform((v) => v ?? '');

/** Texte bilingue : fr obligatoire, en facultatif. */
export const bilingue = z.object({ fr: z.string().min(1), en: texte });
/** Texte bilingue entièrement facultatif. */
export const bilingueFacultatif = z
  .object({ fr: texte, en: texte })
  .nullish()
  .transform((v) => v ?? { fr: '', en: '' });

/** Image optimisée par Astro + texte alternatif, obligatoire en français dès qu'une image est choisie. */
export const imageAvecAlt = ({ image }: SchemaContext, champ: string) =>
  z
    .object({
      image: image().nullish().transform((v) => v ?? null),
      alt: bilingueFacultatif,
    })
    .nullish()
    .transform((v) => v ?? { image: null, alt: { fr: '', en: '' } })
    .superRefine((v, ctx) => {
      if (v.image && v.alt.fr.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: `${champ} : le texte alternatif en français est obligatoire quand une image est choisie.`,
          path: ['alt', 'fr'],
        });
      }
    });

const publie = z.boolean().default(false);
const date = z.coerce.date();
const dateFacultative = z.coerce.date().nullish().transform((v) => v ?? null);
const ordre = z.number().int().nullish().transform((v) => v ?? null);
const fichier = z.string().nullish().transform((v) => v ?? null);
const lien = <C extends 'projets' | 'rapports' | 'evenements'>(c: C) =>
  reference(c).nullish().transform((v) => v ?? null);
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
      sigle: z.string().min(1),
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
      reseauxSociaux: z.array(z.object({ reseau: z.string().min(1), url: z.url() })).default([]),
    }),
});

const presentation = defineCollection({
  loader: glob({ pattern: 'site.json', base: './src/content/presentation' }),
  schema: (ctx) =>
    z.object({
      surtitre: bilingueFacultatif,
      accroche: bilingueFacultatif,
      imageAccueil: imageAvecAlt(ctx, "Photo de l'accueil"),
      chiffres: z.array(z.object({ valeur: z.string().min(1), libelle: bilingue })).default([]),
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

const projets = defineCollection({
  loader: dossier('projets'),
  schema: (ctx) =>
    z.object({
      titre: z.string().min(1),
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
      titre: z.string().min(1),
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
      titre: z.string().min(1),
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
      titre: z.string().min(1),
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
      titre: z.string().min(1),
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
      titre: z.string().min(1),
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
    titre: z.string().min(1),
    titreEn: texte,
    publie,
    annee: z.number().int(),
    type: bilingueFacultatif,
    fichierPdf: fichier,
    resume: bilingueFacultatif,
  }),
});

const partenaires = defineCollection({
  loader: dossier('partenaires'),
  schema: (ctx) =>
    z.object({
      nom: z.string().min(1),
      publie,
      logo: imageAvecAlt(ctx, 'Logo'),
      siteWeb: z.url().nullish().transform((v) => v ?? null),
      categorie: bilingueFacultatif,
      ordre,
    }),
});

const equipe = defineCollection({
  loader: dossier('equipe'),
  schema: (ctx) =>
    z.object({
      nom: z.string().min(1),
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
    nom: z.string().min(1),
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
    question: z.string().min(1),
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
  reglages, presentation, projets, actualites, activites, evenements, galerie,
  offres, rapports, partenaires, equipe, zones, faq, contenus,
};
