import { config, fields, singleton } from '@keystatic/core';

// Champ bilingue : français obligatoire, anglais facultatif.
const bilingue = (label: string, opts: { multiline?: boolean; requis?: boolean } = {}) =>
  fields.object(
    {
      fr: fields.text({
        label: 'Français',
        multiline: opts.multiline ?? false,
        validation: opts.requis === false ? undefined : { isRequired: true },
      }),
      en: fields.text({
        label: 'Anglais (facultatif, le français est affiché sinon)',
        multiline: opts.multiline ?? false,
      }),
    },
    { label, layout: [6, 6] },
  );

const AIDE_IMAGE = 'Image de 3 Mo maximum. Au-delà, la publication est bloquée.';

// Image optimisée par Astro (rangée dans src/assets) + texte alternatif.
const imageAvecAlt = (label: string, dossier: string, description = AIDE_IMAGE) =>
  fields.object(
    {
      image: fields.image({
        label: 'Fichier',
        description,
        directory: `src/assets/${dossier}`,
        publicPath: `../../assets/${dossier}/`,
      }),
      alt: bilingue('Texte alternatif (description de l’image pour les personnes aveugles)', { requis: false }),
    },
    { label },
  );

// En ligne (build de production) : Keystatic enregistre chaque modification
// par un commit sur GitHub, ce qui déclenche la reconstruction du site par Cloudflare.
// En local : Keystatic écrit directement dans les fichiers, sauf si
// PUBLIC_KEYSTATIC_STORAGE=github (utile pour créer l'application GitHub).
const modeGithub = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github';

export default config({
  storage: modeGithub
    ? { kind: 'github', repo: 'nathanayubu03-code/RAPDFEM' }
    : { kind: 'local' },
  ui: {
    brand: { name: 'RAPDFEM' },
  },
  locale: 'fr-FR',
  singletons: {
    reglages: singleton({
      label: 'Réglages du site',
      path: 'src/content/reglages/site',
      format: { data: 'json' },
      schema: {
        sigle: fields.text({ label: 'Sigle', validation: { isRequired: true } }),
        nom: bilingue("Nom complet de l'ONG"),
        presentationCourte: bilingue('Présentation courte (pied de page)', { multiline: true, requis: false }),
        descriptionSeo: bilingue('Description pour les moteurs de recherche', { multiline: true, requis: false }),
        logo: imageAvecAlt('Logo principal', 'reglages'),
        logoFondSombre: imageAvecAlt('Logo pour fond sombre (pied de page)', 'reglages'),
        favicon: fields.image({
          label: 'Favicon (icône de l’onglet)',
          description: 'Image carrée, PNG ou SVG, 3 Mo maximum.',
          directory: 'public/images/reglages',
          publicPath: '/images/reglages/',
        }),
        imageOg: imageAvecAlt('Image de partage par défaut (réseaux sociaux)', 'reglages', 'Format paysage conseillé (1200 × 630). 3 Mo maximum.'),
        bureaux: fields.array(
          fields.object({
            nom: bilingue('Nom du bureau'),
            adresse: bilingue('Adresse', { multiline: true }),
          }),
          { label: 'Adresses des bureaux', itemLabel: (p) => p.fields.nom.fields.fr.value || 'Bureau' },
        ),
        telephones: fields.array(fields.text({ label: 'Téléphone' }), {
          label: 'Téléphones',
          itemLabel: (p) => p.value || 'Téléphone',
        }),
        courriels: fields.array(fields.text({ label: 'Courriel' }), {
          label: 'Courriels',
          itemLabel: (p) => p.value || 'Courriel',
        }),
        reseauxSociaux: fields.array(
          fields.object({
            reseau: fields.text({ label: 'Nom du réseau (ex. Facebook)', validation: { isRequired: true } }),
            url: fields.url({ label: 'Adresse de la page', validation: { isRequired: true } }),
          }),
          { label: 'Réseaux sociaux', itemLabel: (p) => p.fields.reseau.value || 'Réseau' },
        ),
      },
    }),
  },
});
