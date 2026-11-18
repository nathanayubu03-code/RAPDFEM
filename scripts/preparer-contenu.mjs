// Garde-fou n° 1 : contrôle du contenu AVANT la construction du site.
//
// Le contenu est écrit par des personnes dans l'admin : une photo au format iPhone (HEIC),
// un fichier abîmé ou un fichier supprimé suffiraient à faire échouer toute la construction,
// et plus rien ne serait mis en ligne. Ce script repère ces fichiers et, sur le serveur de
// construction (Cloudflare ou GitHub), les met de côté pour que le reste du site soit publié.
// Les fichiers du dépôt ne sont jamais modifiés : seule la copie de construction l'est.
//
// Usage : node scripts/preparer-contenu.mjs           (rapport seulement)
//         node scripts/preparer-contenu.mjs --reparer (répare, uniquement sur un serveur de construction)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import yaml from 'js-yaml';
import sharp from 'sharp';

const RACINE = resolve(dirname(new URL(import.meta.url).pathname), '..');
const CONTENU = join(RACINE, 'src/content');
const PUBLIC = join(RACINE, 'public');
const SUR_SERVEUR = Boolean(process.env.CI || process.env.WORKERS_CI || process.env.CF_PAGES);
const REPARER = process.argv.includes('--reparer') && SUR_SERVEUR;

const IMAGES_OK = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.tif', '.tiff']);
const EXT_IMAGE = /\.(jpe?g|png|webp|avif|gif|svg|tiff?|heic|heif|bmp)$/i;
const problemes = [];
const cache = new Map();

function fichiers(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    statSync(p).isDirectory() ? fichiers(p, out) : out.push(p);
  }
  return out;
}

/** Vérifie qu'une image s'ouvre vraiment (format pris en charge, fichier non abîmé). */
async function imageLisible(chemin) {
  if (cache.has(chemin)) return cache.get(chemin);
  let raison = null;
  const ext = extname(chemin).toLowerCase();
  if (!existsSync(chemin)) raison = 'fichier introuvable';
  else if (!IMAGES_OK.has(ext)) raison = `format ${ext} non pris en charge (utilisez JPG, PNG ou WebP)`;
  else if (ext !== '.svg') {
    try {
      const m = await sharp(chemin).metadata();
      if (!m.width || !m.height) raison = 'image illisible';
    } catch {
      raison = 'image abîmée ou illisible';
    }
  }
  cache.set(chemin, raison);
  return raison;
}

/** Résout un chemin écrit dans le contenu vers un fichier du disque. */
function versDisque(valeur, depuis) {
  const v = decodeURIComponent(valeur.split(/[?#]/)[0]);
  if (v.startsWith('/')) return join(PUBLIC, v);
  return resolve(dirname(depuis), v);
}

/** Parcourt les données (YAML/JSON) et met à null les fichiers inutilisables. */
async function nettoyer(donnee, fichier, chemin = []) {
  let change = false;
  if (Array.isArray(donnee)) {
    for (let i = 0; i < donnee.length; i++) {
      const r = await nettoyer(donnee[i], fichier, [...chemin, i]);
      if (r.remplacer) { donnee[i] = null; change = true; } else change ||= r.change;
    }
    return { change };
  }
  if (donnee && typeof donnee === 'object') {
    for (const k of Object.keys(donnee)) {
      const r = await nettoyer(donnee[k], fichier, [...chemin, k]);
      if (r.remplacer) { donnee[k] = null; change = true; } else change ||= r.change;
    }
    return { change };
  }
  if (typeof donnee === 'string' && (donnee.includes('assets/') || donnee.startsWith('/documents/') || donnee.startsWith('/images/'))) {
    const disque = versDisque(donnee, fichier);
    const raison = EXT_IMAGE.test(donnee) ? await imageLisible(disque) : existsSync(disque) ? null : 'fichier introuvable';
    if (raison) {
      problemes.push(`${relative(RACINE, fichier)} → ${chemin.join('.')} : ${donnee} (${raison})`);
      return { remplacer: true, change: true };
    }
  }
  return { change: false };
}

for (const f of fichiers(CONTENU)) {
  try {
    if (f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json')) {
      const texte = readFileSync(f, 'utf8');
      const donnee = f.endsWith('.json') ? JSON.parse(texte) : yaml.load(texte);
      const { change } = await nettoyer(donnee, f);
      if (change && REPARER) {
        writeFileSync(f, f.endsWith('.json') ? JSON.stringify(donnee, null, 2) + '\n' : yaml.dump(donnee, { lineWidth: -1 }));
      }
    } else if (f.endsWith('.mdoc') || f.endsWith('.md')) {
      // Images insérées dans le texte libre : ![texte](chemin "légende")
      let texte = readFileSync(f, 'utf8');
      let change = false;
      for (const m of [...texte.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)]) {
        const cible = m[1];
        if (/^(https?:|data:)/.test(cible)) continue;
        const raison = await imageLisible(versDisque(cible, f));
        if (raison) {
          problemes.push(`${relative(RACINE, f)} → image dans le texte : ${cible} (${raison})`);
          texte = texte.replace(m[0], '');
          change = true;
        }
      }
      if (change && REPARER) writeFileSync(f, texte);
    }
  } catch (e) {
    // Un fichier illisible ne doit jamais arrêter le contrôle des autres.
    problemes.push(`${relative(RACINE, f)} : fichier impossible à lire (${e instanceof Error ? e.message.split('\n')[0] : e})`);
  }
}

if (problemes.length === 0) {
  console.log('[contrôle du contenu] Aucun problème trouvé.');
} else {
  console.warn(`[contrôle du contenu] ${problemes.length} fichier(s) à corriger dans l'admin :`);
  for (const p of problemes) {
    console.warn('  - ' + p);
    // Sur GitHub, chaque problème apparaît aussi comme un avertissement visible dans l'onglet Actions.
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Contenu à corriger dans l'admin::${p}`);
  }
  console.warn(REPARER
    ? "  → Ces fichiers ont été mis de côté pour cette publication : le reste du site est publié normalement."
    : "  → Rapport seulement (sur le serveur de construction, ces fichiers seraient mis de côté).");
}
