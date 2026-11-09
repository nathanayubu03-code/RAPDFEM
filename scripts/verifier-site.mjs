// Garde-fou n° 2 : contrôle du site APRÈS la construction.
//
// Vérifie chaque page produite : liens internes qui mènent quelque part, version française
// et anglaise de chaque page, un seul grand titre, texte alternatif sur chaque image,
// aucune valeur technique affichée par erreur (« undefined », « NaN »…).
//
// Usage : node scripts/verifier-site.mjs            (échoue s'il y a un problème : contrôle GitHub)
//         node scripts/verifier-site.mjs --avertir  (signale sans bloquer : construction Cloudflare)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const RACINE = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = [join(RACINE, 'dist/client'), join(RACINE, 'dist')].find((d) => existsSync(join(d, 'fr')));
const AVERTIR = process.argv.includes('--avertir');
const problemes = [];

if (!SORTIE) {
  console.warn('[contrôle du site] Dossier de construction introuvable : lancez d’abord npm run build.');
  process.exit(AVERTIR ? 0 : 1);
}

function pages(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}

function existe(href) {
  const chemin = decodeURIComponent(href.split(/[?#]/)[0]);
  if (chemin === '' || chemin === '/') return true;
  const cible = join(SORTIE, chemin);
  return existsSync(cible) && (statSync(cible).isFile() || existsSync(join(cible, 'index.html')))
    || existsSync(cible + '.html');
}

for (const fichier of pages(SORTIE)) {
  const nom = '/' + relative(SORTIE, fichier).replace(/index\.html$/, '');
  const html = readFileSync(fichier, 'utf8');
  if (nom === '/' || nom.startsWith('/keystatic')) continue;
  const corps = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');

  // Liens et images internes
  for (const m of corps.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const url = m[1];
    if (url.startsWith('//') || url.startsWith('/api/') || url.startsWith('/keystatic') || url.startsWith('/_image')) continue;
    if (!existe(url)) problemes.push(`${nom} : lien cassé vers ${url}`);
  }
  for (const m of corps.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url.startsWith('/') && !url.startsWith('/_image') && !existe(url)) problemes.push(`${nom} : image introuvable ${url}`);
    }
  }
  if (nom === '/404.html') continue;

  // Un seul grand titre
  const h1 = (corps.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problemes.push(`${nom} : ${h1} grand(s) titre(s) h1 au lieu d’un seul`);

  // Texte alternatif sur chaque image
  for (const m of corps.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt(=|\s|>|\/)/.test(m[0])) problemes.push(`${nom} : image sans texte alternatif`);
  }

  // Valeurs techniques affichées par erreur
  const texte = corps.replace(/<[^>]+>/g, ' ');
  for (const mot of ['undefined', 'NaN', '[object Object]', 'null']) {
    if (new RegExp(`(^|\\s)${mot.replace(/[[\]]/g, '\\$&')}(\\s|$)`).test(texte)) problemes.push(`${nom} : le texte « ${mot} » s’affiche sur la page`);
  }

  // Chaque page existe dans les deux langues
  const alternes = [...corps.matchAll(/<link rel="alternate" hreflang="(fr|en)" href="https?:\/\/[^/]+(\/[^"]*)"/g)];
  if ((nom.startsWith('/fr/') || nom.startsWith('/en/')) && alternes.length < 2) problemes.push(`${nom} : version française ou anglaise non déclarée`);
  for (const [, langue, chemin] of alternes) {
    if (!existe(chemin)) problemes.push(`${nom} : la version ${langue} (${chemin}) n’existe pas`);
  }
}

if (problemes.length === 0) {
  console.log(`[contrôle du site] ${pages(SORTIE).length} pages vérifiées, aucun problème.`);
} else {
  console.warn(`[contrôle du site] ${problemes.length} problème(s) :`);
  for (const p of [...new Set(problemes)].slice(0, 100)) console.warn('  - ' + p);
  if (!AVERTIR) process.exit(1);
}
