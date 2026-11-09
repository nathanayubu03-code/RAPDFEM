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
    ? {
        kind: 'github',
        repo: 'nathanayubu03-code/RAPDFEM',
        // Seule la branche par défaut (celle que Cloudflare publie) est proposée dans l'admin :
        // impossible d'enregistrer par erreur sur une autre branche jamais mise en ligne.
        branchPrefix: 'brouillon-admin/',
      }
    : { kind: 'local' },
  ui: {
    brand: { name: 'RAPDFEM' },
    navigation: {
      'Identité': ['reglages', 'don'],
      'Le réseau': ['projets', 'activites', 'zones', 'equipe', 'partenaires'],
      'Actualité': ['actualites', 'evenements', 'galerie'],
      'Documents et offres': ['offres', 'rapports', 'faq'],
      'Textes du site': ['presentation'],
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
        nomEn: fields.text({ label: 'Nom en anglais (facultatif, ex. UN Women pour ONU Femmes)' }),
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
    don: singleton({
      label: 'Faire un don (coordonnées bancaires)',
      path: 'src/content/don/site',
      format: { data: 'json' },
      schema: {
        texte: bilingue('Texte d’introduction (facultatif, un texte par défaut est affiché sinon)', { multiline: true, requis: false }),
        comptes: fields.array(
          fields.object({
            banque: fields.text({ label: 'Banque', validation: { isRequired: true } }),
            intitule: fields.text({ label: 'Intitulé du compte' }),
            numero: fields.text({ label: 'Numéro de compte', validation: { isRequired: true } }),
            swift: fields.text({ label: 'Code SWIFT (facultatif)' }),
            devise: fields.text({ label: 'Devise (facultatif, ex. USD)' }),
          }),
          { label: 'Comptes bancaires', itemLabel: (p) => p.fields.banque.value || 'Compte' },
        ),
      },
    }),

    presentation: singleton({
      label: 'Présentation du réseau (accueil et à propos)',
      path: 'src/content/presentation/site',
      format: { data: 'json' },
      schema: {
        surtitre: bilingue("Surtitre de l'accueil (petite ligne au-dessus du nom)", { requis: false }),
        accroche: bilingue("Phrase d'accroche de l'accueil", { multiline: true, requis: false }),
        imageAccueil: imageAvecAlt("Photo de l'accueil (facultatif)", 'presentation', 2),
        chiffres: fields.array(
          fields.object({
            valeur: fields.text({ label: 'Chiffre (ex. 20)', validation: { isRequired: true } }),
            libelle: bilingue('Texte sous le chiffre'),
          }),
          { label: 'Chiffres clés', itemLabel: (p) => `${p.fields.valeur.value} ${p.fields.libelle.fields.fr.value}` },
        ),
        statut: bilingue('Qui sommes-nous (statut, création)', { multiline: true, requis: false }),
        mission: bilingue('Mission', { multiline: true, requis: false }),
        vision: bilingue('Vision', { multiline: true, requis: false }),
        objectif: bilingue('Objectif général', { multiline: true, requis: false }),
        axes: fields.array(
          fields.object({
            titre: bilingue("Titre de l'axe"),
            texte: bilingue('Texte (facultatif)', { multiline: true, requis: false }),
            points: fields.array(bilingue('Point'), {
              label: 'Points de la liste',
              itemLabel: (p) => p.fields.fr.value || 'Point',
            }),
          }),
          { label: "Axes d'intervention", itemLabel: (p) => p.fields.titre.fields.fr.value || 'Axe' },
        ),
        approches: fields.array(bilingue('Approche'), {
          label: 'Approches',
          itemLabel: (p) => p.fields.fr.value || 'Approche',
        }),
        documentsLegaux: fields.array(bilingue('Document ou autorisation'), {
          label: 'Documents légaux (page Publications et transparence)',
          itemLabel: (p) => p.fields.fr.value || 'Document',
        }),
        politiques: fields.array(
          fields.object({
            titre: bilingue('Titre de la politique'),
            fichierPdf: pdf('politiques', 'Fichier PDF'),
          }),
          {
            label: 'Politiques internes (affichées seulement quand le PDF est ajouté)',
            itemLabel: (p) => p.fields.titre.fields.fr.value || 'Politique',
          },
        ),
      },
    }),

    reglages: singleton({
      label: 'Logo et coordonnées',
      path: 'src/content/reglages/site',
      format: { data: 'json' },
      schema: {
        logo: imageAvecAlt("Logo de l'ONG (en-tête du site)", 'reglages', 2, 'PNG avec fond transparent conseillé, carré, au moins 400 × 400 pixels. 3 Mo maximum.'),
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
        sigle: fields.text({ label: 'Sigle', validation: { isRequired: true } }),
        nom: bilingue("Nom complet de l'ONG"),
        presentationCourte: bilingue('Présentation courte (pied de page)', { multiline: true, requis: false }),
        descriptionSeo: bilingue('Description pour les moteurs de recherche', { multiline: true, requis: false }),
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
