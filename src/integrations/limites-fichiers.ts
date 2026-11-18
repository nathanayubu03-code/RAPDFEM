import type { AstroIntegration } from 'astro';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keystatic ne sait pas limiter la taille d'un fichier au téléversement.
// Ce contrôle signale dans le journal de construction les images de plus de 3 Mo
// et les PDF de plus de 10 Mo, SANS bloquer la publication : les images sont de toute
// façon réduites par Astro. Seul un PDF de plus de 25 Mo bloque, car Cloudflare le refuserait.

const MO = 1024 * 1024;
const IMAGE_MAX = 3 * MO;
const PDF_MAX = 10 * MO;
const PDF_BLOQUANT = 25 * MO;
const IMAGES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.ico']);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let bloquants: string[] = [];

export function fichiersTropLourds(root: string): string[] {
  bloquants = [];
  const dirs = ['src/assets', 'public/images', 'public/documents'].map((d) => join(root, d));
  const errors: string[] = [];
  for (const file of dirs.flatMap((d) => walk(d))) {
    const ext = extname(file).toLowerCase();
    const size = statSync(file).size;
    const name = relative(root, file);
    const mo = (size / MO).toFixed(1).replace('.', ',');
    if (IMAGES.has(ext) && size > IMAGE_MAX) {
      errors.push(`Image trop lourde : ${name} (${mo} Mo). Maximum 3 Mo. Réduisez la photo puis téléversez-la à nouveau.`);
    } else if (ext === '.pdf' && size > PDF_BLOQUANT) {
      bloquants.push(`PDF trop lourd pour l'hébergement : ${name} (${mo} Mo). Maximum 25 Mo. Compressez-le puis téléversez-le à nouveau.`);
    } else if (ext === '.pdf' && size > PDF_MAX) {
      errors.push(`PDF trop lourd : ${name} (${mo} Mo). Maximum 10 Mo. Compressez le PDF puis téléversez-le à nouveau.`);
    }
  }
  return errors;
}

export default function limitesFichiers(): AstroIntegration {
  let root = process.cwd();
  return {
    name: 'rapdfem:limites-fichiers',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:build:start': ({ logger }) => {
        for (const e of fichiersTropLourds(root)) logger.warn(e);
        if (bloquants.length > 0) {
          for (const e of bloquants) logger.error(e);
          throw new Error(`Publication bloquée : ${bloquants.length} PDF trop lourd(s). Voir les messages ci-dessus.`);
        }
      },
    },
  };
}
