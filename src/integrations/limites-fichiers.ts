import type { AstroIntegration } from 'astro';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keystatic ne sait pas limiter la taille d'un fichier au téléversement.
// Ce contrôle bloque la publication si une image dépasse 3 Mo ou un PDF 10 Mo,
// avec un message qui nomme le fichier en cause.

const MO = 1024 * 1024;
const IMAGE_MAX = 3 * MO;
const PDF_MAX = 10 * MO;
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

export function fichiersTropLourds(root: string): string[] {
  const dirs = ['src/assets', 'public/images', 'public/documents'].map((d) => join(root, d));
  const errors: string[] = [];
  for (const file of dirs.flatMap((d) => walk(d))) {
    const ext = extname(file).toLowerCase();
    const size = statSync(file).size;
    const name = relative(root, file);
    const mo = (size / MO).toFixed(1).replace('.', ',');
    if (IMAGES.has(ext) && size > IMAGE_MAX) {
      errors.push(`Image trop lourde : ${name} (${mo} Mo). Maximum 3 Mo. Réduisez la photo puis téléversez-la à nouveau.`);
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
        const errors = fichiersTropLourds(root);
        if (errors.length > 0) {
          for (const e of errors) logger.error(e);
          throw new Error(`Publication bloquée : ${errors.length} fichier(s) trop lourd(s). Voir les messages ci-dessus.`);
        }
      },
    },
  };
}
