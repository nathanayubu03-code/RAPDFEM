import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* Champs communs */

/** Texte bilingue : fr obligatoire, en facultatif. */
export const bilingue = z.object({
  fr: z.string().min(1),
  en: z.string().optional().default(''),
});
/** Texte bilingue entièrement facultatif. */
export const bilingueFacultatif = z.object({
  fr: z.string().optional().default(''),
  en: z.string().optional().default(''),
});

/** Image optimisée par Astro + texte alternatif, obligatoire en français dès qu'une image est choisie. */
export const imageAvecAlt = ({ image }: SchemaContext, champ: string) =>
  z
    .object({
      image: image().nullable().optional().default(null),
      alt: bilingueFacultatif,
    })
    .superRefine((v, ctx) => {
      if (v.image && v.alt.fr.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: `${champ} : le texte alternatif en français est obligatoire quand une image est choisie.`,
          path: ['alt', 'fr'],
        });
      }
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
      favicon: z.string().nullable().optional().default(null),
      imageOg: imageAvecAlt(ctx, 'Image de partage'),
      bureaux: z.array(z.object({ nom: bilingue, adresse: bilingue })).default([]),
      telephones: z.array(z.string()).default([]),
      courriels: z.array(z.string()).default([]),
      reseauxSociaux: z.array(z.object({ reseau: z.string().min(1), url: z.url() })).default([]),
    }),
});

export const collections = { reglages };
