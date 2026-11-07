# Site du RAPDFEM

Site du Réseau d'Associations pour la Promotion des Droits de la Femme (Goma, RDC).
Astro 7, TypeScript strict, français par défaut (`/fr/`) et anglais (`/en/`).
Administration Keystatic sur `/keystatic` (mode GitHub en ligne, fichiers locaux en développement).
Hébergement : Cloudflare Workers. Mise en ligne : voir `DEPLOIEMENT.md`.

## Démarrer

Node 22.23.4 ou plus récent est requis par Astro 7 (voir `.nvmrc`).

```bash
npm install
npm run dev
```

Vérifications avant chaque livraison :

```bash
npm run build
npx astro check
```

## Où se trouvent les choses

- `src/i18n/fr.ts` et `src/i18n/en.ts` : tous les textes d'interface.
- `src/i18n/index.ts` : langues, adresses des pages, menus.
- `keystatic.config.ts` : ce que l'administration permet de modifier.
- `src/content.config.ts` : schémas Zod des contenus (lus par Astro).
- `src/content/reglages/site.json` : réglages du site, édités dans Keystatic (Réglages du site).
- `src/assets/` : images téléversées, optimisées par Astro (WebP).
- `src/integrations/limites-fichiers.ts` : bloque le build si une image dépasse 3 Mo ou un PDF 10 Mo.
- `src/styles/tokens.css` : couleurs, police, espacements repris de la maquette Claude Design.
- `src/components/SEO.astro` : title, description, Open Graph, canonique, hreflang.
- `public/_redirects` : redirection `/` vers `/fr/` sur Netlify et Cloudflare Pages.
