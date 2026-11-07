import { collection, config, fields, singleton } from '@keystatic/core';

/* ------------------------------------------------------------------ */
/* Briques communes                                                    */
/* ------------------------------------------------------------------ */

const AIDE_IMAGE = 'Image de 3 Mo maximum. Au-delà, la publication est bloquée.';
const AIDE_PDF = 'PDF de 10 Mo maximum. Au-delà, la publication est bloquée.';

// Champ bilingue : français obligatoire (sauf mention contraire), anglais facultatif.
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

// Image rangée dans src/assets (optimisée par Astro) + texte alternatif.
// Le texte alternatif en français est exigé au build dès qu'une image est choisie.
const imageAvecAlt = (label: string, dossier: string, profondeur: 2 | 3, description = AIDE_IMAGE) =>
  fields.object(
    {
      image: fields.image({
        label: 'Fichier',
        description,
        directory: `src/assets/${dossier}`,
        publicPath: `${'../'.repeat(profondeur)}assets/${dossier}/`,
      }),
      alt: bilingue('Texte alternatif : décrivez l’image en une phrase (obligatoire en français si une image est choisie)', {
        requis: false,
      }),
    },
    { label },
  );

const photos = (dossier: string) =>
  fields.array(imageAvecAlt('Photo', dossier, 3), {
    label: 'Photos',
    description: 'Ajoutez les photos une par une. 3 Mo maximum chacune.',
    itemLabel: (p) => p.fields.alt.fields.fr.value || 'Photo',
  });

// Espace d'écriture libre (titres, gras, listes, liens, images), en français et en anglais.
const editeur = (dossier: string, label: string, requis: boolean) =>
  fields.markdoc({
    label,
    description: requis
      ? undefined
      : 'Facultatif. Si cet espace est vide, la version française est affichée.',
    extension: 'mdoc',
    options: {
      heading: [2, 3],
      table: false,
      codeBlock: false,
      code: false,
      image: {
        directory: `src/assets/${dossier}`,
        publicPath: `../../../assets/${dossier}/`,
        schema: {
          alt: fields.text({
            label: 'Texte alternatif (décrivez l’image en une phrase)',
            validation: { isRequired: true },
          }),
          title: fields.text({ label: 'Légende (facultatif)' }),
        },
      },
    },
  });

const contenuLibre = (dossier: string) => ({
  contenuFr: editeur(dossier, 'Contenu en français', true),
  contenuEn: editeur(dossier, 'Contenu en anglais', false),
});

const publie = fields.checkbox({
  label: 'Publié',
  description: 'Cochez pour afficher cet élément sur le site. Décoché : brouillon visible uniquement ici.',
  defaultValue: false,
});

const titre = fields.slug({
  name: { label: 'Titre (français)', validation: { isRequired: true } },
  slug: {
    label: 'Adresse de la page',
    description: 'Générée à partir du titre. Évitez de la changer une fois publiée.',
  },
});
const titreEn = fields.text({ label: 'Titre (anglais, facultatif)' });

const pdf = (dossier: string, label: string) =>
  fields.file({
    label,
    description: AIDE_PDF,
    directory: `public/documents/${dossier}`,
    publicPath: `/documents/${dossier}/`,
  });

const ordre = fields.integer({
  label: "Ordre d'affichage",
  description: 'Les plus petits nombres apparaissent en premier. Laissez vide pour le classement par défaut.',
});

// Chaque élément est un dossier : index.yaml (les champs) + contenuFr.mdoc / contenuEn.mdoc.
const dossierDe = (nom: string) => ({
  path: `src/content/${nom}/*/` as `${string}/*/`,
  format: { data: 'yaml' as const },
});

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

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
    navigation: {
      'Le réseau': ['projets', 'activites', 'zones', 'equipe', 'partenaires'],
      'Actualité': ['actualites', 'evenements', 'galerie'],
      'Documents et offres': ['offres', 'rapports', 'faq'],
      'Site': ['reglages'],
    },
  },
  locale: 'fr-FR',

  collections: {
    projets: collection({
      label: 'Projets',
      slugField: 'titre',
      ...dossierDe('projets'),
      columns: ['titre'],
      schema: {
        titre,
        titreEn,
        publie,
        imagePrincipale: imageAvecAlt('Image principale', 'projets', 3),
        ...contenuLibre('projets'),
        photos: photos('projets'),
        ordre,
      },
    }),

    actualites: collection({
      label: 'Actualités',
      slugField: 'titre',
      ...dossierDe('actualites'),
      columns: ['titre', 'date'],
      schema: {
        titre,
        titreEn,
        publie,
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        resume: bilingue('Résumé (affiché dans les listes)', { multiline: true, requis: false }),
        imagePrincipale: imageAvecAlt('Image principale', 'actualites', 3),
        ...contenuLibre('actualites'),
        projetLie: fields.relationship({ label: 'Projet lié (facultatif)', collection: 'projets' }),
      },
    }),

    activites: collection({
      label: 'Activités',
      slugField: 'titre',
      ...dossierDe('activites'),
      columns: ['titre', 'date'],
      schema: {
        titre,
        titreEn,
        publie,
        date: fields.date({ label: 'Date (facultatif)' }),
        domaine: bilingue('Domaine (facultatif, écrivez librement)', { requis: false }),
        ...contenuLibre('activites'),
        photos: photos('activites'),
        projetLie: fields.relationship({ label: 'Projet lié (facultatif)', collection: 'projets' }),
        rapportLie: fields.relationship({ label: 'Rapport lié (facultatif)', collection: 'rapports' }),
      },
    }),

    evenements: collection({
      label: 'Événements',
      slugField: 'titre',
      ...dossierDe('evenements'),
      columns: ['titre', 'date'],
      schema: {
        titre,
        titreEn,
        publie,
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        lieu: bilingue('Lieu (facultatif)', { requis: false }),
        image: imageAvecAlt('Image', 'evenements', 3),
        ...contenuLibre('evenements'),
      },
    }),

    galerie: collection({
      label: 'Galerie photos',
      slugField: 'titre',
      ...dossierDe('galerie'),
      columns: ['titre', 'date'],
      schema: {
        titre,
        titreEn,
        publie,
        image: imageAvecAlt('Photo', 'galerie', 3),
        legende: bilingue('Légende (facultatif)', { multiline: true, requis: false }),
        date: fields.date({ label: 'Date (facultatif)' }),
        projetLie: fields.relationship({ label: 'Projet lié (facultatif)', collection: 'projets' }),
        evenementLie: fields.relationship({ label: 'Événement lié (facultatif)', collection: 'evenements' }),
      },
    }),

    offres: collection({
      label: 'Offres (emplois, stages, appels d’offres)',
      slugField: 'titre',
      ...dossierDe('offres'),
      columns: ['titre', 'dateLimite'],
      schema: {
        titre,
        titreEn,
        publie,
        dateLimite: fields.date({
          label: 'Date limite (facultatif)',
          description:
            'Le lendemain de cette date, l’offre passe automatiquement dans « offres clôturées ». Sans date, elle reste ouverte jusqu’à ce que vous la dépubliiez.',
        }),
        ...contenuLibre('offres'),
        photos: photos('offres'),
        fichierPdf: pdf('offres', 'Document PDF (facultatif)'),
      },
    }),

    rapports: collection({
      label: 'Rapports et publications',
      slugField: 'titre',
      ...dossierDe('rapports'),
      columns: ['titre', 'annee'],
      schema: {
        titre,
        titreEn,
        publie,
        annee: fields.integer({ label: 'Année', validation: { isRequired: true, min: 2015, max: 2100 } }),
        type: bilingue('Type (facultatif, ex. rapport annuel, étude, politique)', { requis: false }),
        fichierPdf: pdf('rapports', 'Fichier PDF'),
        resume: bilingue('Résumé (facultatif)', { multiline: true, requis: false }),
      },
    }),

    partenaires: collection({
      label: 'Partenaires',
      slugField: 'nom',
      ...dossierDe('partenaires'),
      columns: ['nom'],
      schema: {
        nom: fields.slug({ name: { label: 'Nom', validation: { isRequired: true } } }),
        publie,
        logo: imageAvecAlt('Logo officiel', 'partenaires', 3),
        siteWeb: fields.url({ label: 'Site web (facultatif)' }),
        categorie: bilingue('Catégorie (facultatif)', { requis: false }),
        ordre,
      },
    }),

    equipe: collection({
      label: 'Équipe',
      slugField: 'nom',
      ...dossierDe('equipe'),
      columns: ['nom'],
      schema: {
        nom: fields.slug({ name: { label: 'Nom', validation: { isRequired: true } } }),
        publie,
        fonction: bilingue('Fonction'),
        bio: bilingue('Biographie (facultatif)', { multiline: true, requis: false }),
        photo: imageAvecAlt('Photo', 'equipe', 3),
        ordre,
      },
    }),

    zones: collection({
      label: "Zones d'intervention",
      slugField: 'nom',
      ...dossierDe('zones'),
      columns: ['nom'],
      schema: {
        nom: fields.slug({ name: { label: 'Nom (province)', validation: { isRequired: true } } }),
        nomEn: fields.text({ label: 'Nom en anglais (facultatif)' }),
        publie,
        province: fields.text({ label: 'Province' }),
        territoire: bilingue('Villes, territoires et zones de santé', { multiline: true, requis: false }),
        antennes: fields.array(bilingue('Antenne ou bureau'), {
          label: 'Antennes et bureaux',
          itemLabel: (p) => p.fields.fr.value || 'Antenne',
        }),
        description: bilingue('Description (facultatif)', { multiline: true, requis: false }),
        ordre,
      },
    }),

    faq: collection({
      label: 'Questions fréquentes (FAQ)',
      slugField: 'question',
      ...dossierDe('faq'),
      columns: ['question'],
      schema: {
        question: fields.slug({ name: { label: 'Question (français)', validation: { isRequired: true } } }),
        questionEn: fields.text({ label: 'Question (anglais, facultatif)' }),
        publie,
        reponse: bilingue('Réponse', { multiline: true }),
        categorie: bilingue('Catégorie (facultatif)', { requis: false }),
        ordre,
      },
    }),
  },

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
        logo: imageAvecAlt('Logo principal', 'reglages', 2),
        logoFondSombre: imageAvecAlt('Logo pour fond sombre (pied de page)', 'reglages', 2),
        favicon: fields.image({
          label: 'Favicon (icône de l’onglet)',
          description: 'Image carrée, PNG ou SVG, 3 Mo maximum.',
          directory: 'public/images/reglages',
          publicPath: '/images/reglages/',
        }),
        imageOg: imageAvecAlt(
          'Image de partage par défaut (réseaux sociaux)',
          'reglages',
          2,
          'Format paysage conseillé (1200 × 630). 3 Mo maximum.',
        ),
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
