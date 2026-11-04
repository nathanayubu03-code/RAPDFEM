// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.rapdfem.org',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  integrations: [
    sitemap({
      // Les balises hreflang sont posées dans chaque page par SEO.astro.
      filter: (page) => !page.endsWith('/404/') && new URL(page).pathname !== '/',
    }),
  ],
});
