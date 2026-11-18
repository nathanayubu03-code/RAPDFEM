import { defineMiddleware } from 'astro:middleware';

// L'application GitHub de l'admin n'accepte la connexion que sur https://www.rapdfem.org.
// Toute ouverture de l'admin par une autre adresse (rapdfem.org sans www, ancienne adresse
// en .workers.dev) est donc renvoyée vers la bonne, avec le même chemin.
// Ce code ne tourne que pour les pages de l'admin : les pages du site sont des fichiers statiques.
const ADRESSE_ADMIN = 'www.rapdfem.org';

export const onRequest = defineMiddleware((context, next) => {
  const url = context.url;
  const hote = url.hostname;
  const estAdmin = url.pathname.startsWith('/keystatic') || url.pathname.startsWith('/api/keystatic');
  const enLigne = hote.endsWith('rapdfem.org') || hote.endsWith('.workers.dev');
  if (estAdmin && enLigne && hote !== ADRESSE_ADMIN) {
    return context.redirect(`https://${ADRESSE_ADMIN}${url.pathname}${url.search}`, 302);
  }
  return next();
});
