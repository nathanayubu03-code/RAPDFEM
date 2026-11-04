import raw from '../content/reglages/site.json';
import type { Localized } from '../i18n';

// Réglages du site. Ce fichier sera édité par Keystatic (singleton « Réglages ») à l'étape 3.
// Aucun champ pour des coordonnées bancaires, volontairement.

export type ImageSetting = { src: string; alt: Localized } | null;
export type Office = { nom: Localized; adresse: Localized };
export type SocialLink = { reseau: string; url: string };

export type SiteSettings = {
  nom: Localized;
  sigle: string;
  presentationCourte: Localized;
  descriptionSeo: Localized;
  logo: ImageSetting;
  logoFondSombre: ImageSetting;
  favicon: string | null;
  imageOg: ImageSetting;
  bureaux: Office[];
  telephones: string[];
  courriels: string[];
  reseauxSociaux: SocialLink[];
};

export const settings: SiteSettings = raw as SiteSettings;

/** Numéro au format tel: (chiffres et + uniquement). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
