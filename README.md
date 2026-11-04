# Site du RAPDFEM

Site du Réseau d'Associations pour la Promotion des Droits de la Femme (Goma, RDC).
Astro 7, TypeScript strict, français par défaut (`/fr/`) et anglais (`/en/`).

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
- `src/content/reglages/site.json` : réglages du site (nom, adresses, téléphones, courriels, logos). Édité par Keystatic à partir de l'étape 3.
- `src/styles/tokens.css` : couleurs, police, espacements repris de la maquette Claude Design.
- `src/components/SEO.astro` : title, description, Open Graph, canonique, hreflang.
- `public/_redirects` : redirection `/` vers `/fr/` sur Netlify et Cloudflare Pages.
