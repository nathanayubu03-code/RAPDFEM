// Textes d'interface en français (langue par défaut).
// Toute clé ajoutée ici doit aussi exister dans en.ts (contrôlé par TypeScript).
const fr = {
  'site.skip': 'Aller au contenu',
  'site.home': 'accueil',
  'site.langLabel': 'Langue',
  'site.menu': 'Menu',
  'site.mainNav': 'Menu principal',
  'site.footerNav': 'Liens du pied de page',
  'site.underConstruction': 'En construction',
  'site.underConstructionText': 'Cette page est en construction.',
  'site.notInEnglish': "Cette page n'est pas encore disponible en anglais.",

  'nav.home': 'Accueil',
  'nav.about': 'À propos',
  'nav.projects': 'Projets',
  'nav.zones': "Zones d'intervention",
  'nav.news': 'Actualités',
  'nav.events': 'Événements',
  'nav.gallery': 'Galerie',
  'nav.reports': 'Publications',
  'nav.offers': 'Offres',
  'nav.partners': 'Partenaires',
  'nav.faq': 'FAQ',
  'nav.contact': 'Contact',

  'footer.contact': 'Contact',
  'footer.offices': 'Bureaux',
  'footer.links': 'Liens',
  'footer.reportsLong': 'Publications et transparence',
  'footer.social': 'Réseaux sociaux',

  'notFound.kicker': 'Erreur 404',
  'notFound.title': 'Cette page est introuvable',
  'notFound.text': "L'adresse est peut-être incorrecte, ou la page a été déplacée.",
  'notFound.back': "Retour à l'accueil",
  'notFound.report': 'Signaler un lien cassé',
  'notFound.useful': 'Pages utiles',
  'notFound.projects': 'Nos projets',
} as const;

export type UIKey = keyof typeof fr;
export default fr satisfies Record<string, string>;
