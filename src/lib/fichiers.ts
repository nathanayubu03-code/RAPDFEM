import { statSync } from 'node:fs';
import { join } from 'node:path';

/** Poids lisible d'un fichier de public/ (ex. « 1,2 Mo »), ou null s'il est introuvable. */
export function poids(publicPath: string | null, lang: 'fr' | 'en'): string | null {
  if (!publicPath) return null;
  try {
    const size = statSync(join(process.cwd(), 'public', decodeURIComponent(publicPath))).size;
    const fmt = (n: number) => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1 });
    if (size >= 1024 * 1024) return `${fmt(size / 1024 / 1024)} ${lang === 'fr' ? 'Mo' : 'MB'}`;
    return `${fmt(Math.max(1, Math.round(size / 1024)))} ${lang === 'fr' ? 'Ko' : 'KB'}`;
  } catch {
    return null;
  }
}
