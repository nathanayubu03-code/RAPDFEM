// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';
import limitesFichiers from './src/integrations/limites-fichiers.ts';

// Le site public est entièrement statique (pré-rendu).
// Seules les routes de Keystatic (/keystatic et /api/keystatic) tournent sur Cloudflare Workers.
// En développement local (astro dev), on reste sous Node : Keystatic y écrit directement
// dans les fichiers du dépôt, ce que l'environnement Cloudflare ne permet pas.
const enDev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://www.rapdfem.org',
  trailingSlash: 'ignore', // 'always' casse les routes internes de Keystatic
  output: 'static',
  adapter: enDev
    ? undefined
    : cloudflare({
        imageService: 'compile',
        prerenderEnvironment: 'node',
      }),
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    markdoc(),
    keystatic(),
    limitesFichiers(),
    sitemap({
      // Les balises hreflang sont posées dans chaque page par SEO.astro.
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.endsWith('/404/') && path !== '/' && !path.startsWith('/keystatic');
      },
    }),
  ],
});
