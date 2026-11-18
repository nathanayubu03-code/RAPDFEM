# Site du RAPDFEM

Site du Réseau d'Associations pour la Promotion des Droits de la Femme (Goma, RDC).
Astro 7, TypeScript strict, français par défaut (`/fr/`) et anglais (`/en/`).
Administration Keystatic sur `/keystatic` (mode GitHub en ligne, fichiers locaux en développement).
Hébergement : Cloudflare Workers. Mise en ligne : voir `DEPLOIEMENT.md`. Guide des administrateurs : `ADMIN.md`.

## Démarrer

Node 22.23.4 ou plus récent est requis par Astro 7 (voir `.nvmrc`).

```bash
npm install
npm run dev
```

Vérifications avant chaque livraison (la construction contrôle le contenu avant, et les pages après) :

```bash
npm run build
npx astro check
```

## Où se trouvent les choses

- `src/i18n/fr.ts` et `src/i18n/en.ts` : tous les textes d'interface.
- `src/i18n/index.ts` : langues, adresses des pages, menus.
- `keystatic.config.ts` : ce que l'administration permet de modifier.
- `src/content.config.ts` : schémas Zod des contenus (lus par Astro).
- `src/content/reglages/site.json` : réglages du site, édités dans Keystatic (Identité, Logo et coordonnées).
- `src/content/presentation/site.json` : textes de l'accueil, de « À propos » et de la transparence.
- `src/content/<collection>/<slug>/` : un dossier par élément (index.yaml + contenuFr.mdoc / contenuEn.mdoc).
- `src/views/` : les pages ; `src/pages/[lang]/` les route en français et en anglais.
- `src/assets/` : images téléversées, optimisées par Astro (WebP).
- `scripts/preparer-contenu.mjs` : garde-fou d'avant construction (images HEIC, abîmées ou supprimées mises de côté).
- `scripts/verifier-site.mjs` : garde-fou d'après construction (liens, langues, titres, images) ; `npm run verifier`.
- `src/integrations/limites-fichiers.ts` : signale les fichiers lourds (bloque seulement un PDF de plus de 25 Mo).
- `.github/workflows/` : contrôle à chaque modification, reconstruction quotidienne.
- `src/styles/tokens.css` : couleurs, police, espacements repris de la maquette Claude Design.
- `src/components/SEO.astro` : title, description, Open Graph, canonique, hreflang.
- `src/pages/index.astro` : l’adresse racine envoie vers la langue choisie (bouton FR/EN), sinon celle du navigateur, sinon le français.
