import { defineMiddleware } from 'astro:middleware';
import { getSecret } from 'astro:env/server';
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import keystaticConfig from '../keystatic.config';

// Garde-fous de l'administration (/keystatic). Ce code ne tourne que pour les pages de l'admin :
// les pages du site sont des fichiers statiques servis directement par Cloudflare.
//
// 1. Une seule adresse : l'application GitHub n'accepte la connexion que sur www.rapdfem.org.
// 2. Des clés tolérantes : espaces copiés par erreur retirés, KEYSTATIC_SECRET trop courte
//    (Keystatic exige 32 caractères et plante sinon) ou absente rendue utilisable.
// 3. Des erreurs lisibles : en cas d'échec de connexion, une page en français explique quoi faire.
// 4. Une page de diagnostic : /api/keystatic/diagnostic vérifie les réglages sans rien dévoiler.

const ADRESSE_ADMIN = 'www.rapdfem.org';
const encodeur = new TextEncoder();

async function empreinte(texte: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', encodeur.encode(texte));
  return Array.from(new Uint8Array(h), (o) => o.toString(16).padStart(2, '0')).join('');
}

function lire(nom: string): string {
  try {
    return (getSecret(nom) ?? '').trim();
  } catch {
    return '';
  }
}

interface Cles { clientId: string; clientSecret: string; secret: string; secretBrut: string }

async function cles(): Promise<Cles> {
  const clientId = lire('KEYSTATIC_GITHUB_CLIENT_ID');
  const clientSecret = lire('KEYSTATIC_GITHUB_CLIENT_SECRET');
  const secretBrut = lire('KEYSTATIC_SECRET');
  // Clé longue : utilisée telle quelle. Clé courte : allongée de façon stable. Clé absente :
  // dérivée du secret client GitHub, lui-même secret. Dans tous les cas, plus de plantage.
  const secret =
    secretBrut.length >= 32
      ? secretBrut
      : await empreinte(`rapdfem-keystatic:${secretBrut || clientSecret}`);
  return { clientId, clientSecret, secret, secretBrut };
}

/** Les identifiants de l'application GitHub sont-ils acceptés par GitHub ? */
async function identifiantsValides(c: Cles): Promise<boolean | null> {
  if (!c.clientId || !c.clientSecret) return false;
  try {
    const r = await fetch(`https://api.github.com/applications/${encodeURIComponent(c.clientId)}/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${c.clientId}:${c.clientSecret}`)}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'rapdfem-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: 'ghu_verification_rapdfem' }),
    });
    // 404 ou 422 : GitHub a accepté les identifiants (le jeton de test, lui, n'existe pas).
    if (r.status === 404 || r.status === 422) return true;
    if (r.status === 401 || r.status === 403) return false;
    return null;
  } catch {
    return null;
  }
}

function page(titre: string, corps: string, statut = 200): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${titre} · Admin RAPDFEM</title>
<style>body{margin:0;font:16px/1.6 system-ui,Arial,sans-serif;background:#F4F6FB;color:#1F2328}
main{max-width:640px;margin:48px auto;padding:32px;background:#fff;border-top:4px solid #F5C518;border-radius:8px;box-shadow:0 10px 30px -18px rgba(26,46,102,.5)}
h1{margin:0 0 16px;font-size:24px;color:#1A2E66}li{margin:6px 0}.ok{color:#1F7A3D;font-weight:700}.ko{color:#B42318;font-weight:700}
a.btn{display:inline-block;margin-top:16px;padding:10px 18px;background:#1F4AA8;color:#fff;border-radius:4px;text-decoration:none;font-weight:700}
code{background:#F4F6FB;padding:1px 5px;border-radius:3px}</style></head><body><main><h1>${titre}</h1>${corps}</main></body></html>`;
  return new Response(html, { status: statut, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function rapport(c: Cles): Promise<string> {
  const valides = await identifiantsValides(c);
  const ligne = (ok: boolean | null, texte: string, aide: string) =>
    `<li>${ok === null ? '<span>?</span>' : ok ? '<span class="ok">OK</span>' : '<span class="ko">À corriger</span>'} ${texte}${ok === false ? `<br><small>${aide}</small>` : ''}</li>`;
  return `<ul>
${ligne(!!c.clientId, 'Identifiant de l\'application GitHub (<code>KEYSTATIC_GITHUB_CLIENT_ID</code>)', 'Cloudflare, rapdfem, Décors : ajouter ce secret avec l\'« ID client » affiché sur la page GitHub de l\'application rapdfem-admin.')}
${ligne(!!c.clientSecret, 'Clé secrète de l\'application GitHub (<code>KEYSTATIC_GITHUB_CLIENT_SECRET</code>)', 'GitHub, application rapdfem-admin, Références : générer un nouveau secret client, puis le coller dans Cloudflare.')}
${ligne(valides, 'GitHub accepte ces deux identifiants ensemble', 'La clé secrète ne correspond pas à l\'application : en générer une nouvelle sur GitHub (Références) et la coller dans Cloudflare, puis Déployer.')}
${ligne(c.secretBrut.length >= 32 ? true : null, `Clé de session (<code>KEYSTATIC_SECRET</code>) : ${c.secretBrut.length >= 32 ? 'longue, parfaite' : c.secretBrut ? 'courte, compensée automatiquement (une clé de 32 caractères ou plus reste conseillée)' : 'absente, compensée automatiquement'}`, '')}
</ul>`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const hote = url.hostname;
  const chemin = url.pathname;
  const estAdmin = chemin.startsWith('/keystatic') || chemin.startsWith('/api/keystatic');
  if (!estAdmin) return next();

  const enLigne = hote.endsWith('rapdfem.org') || hote.endsWith('.workers.dev');
  if (enLigne && hote !== ADRESSE_ADMIN) {
    return context.redirect(`https://${ADRESSE_ADMIN}${chemin}${url.search}`, 302);
  }

  // En développement local, Keystatic écrit dans les fichiers : rien à renforcer.
  if (!chemin.startsWith('/api/keystatic') || keystaticConfig.storage.kind !== 'github') return next();

  const c = await cles();

  if (chemin.replace(/\/$/, '') === '/api/keystatic/diagnostic') {
    return page(
      'Vérification de l\'administration',
      `<p>Cette page contrôle les réglages de connexion, sans afficher aucune clé.</p>${await rapport(c)}
<p>Si tout est OK et que la connexion échoue quand même : vérifiez que le compte GitHub utilisé est bien invité sur le dépôt RAPDFEM, et ouvrez l'admin dans une fenêtre de navigation privée.</p>
<a class="btn" href="/keystatic">Ouvrir l'administration</a>`,
    );
  }

  const estRetourGithub = chemin.replace(/\/$/, '') === '/api/keystatic/github/oauth/callback';
  try {
    const handler = makeGenericAPIRouteHandler(
      { config: keystaticConfig, clientId: c.clientId, clientSecret: c.clientSecret, secret: c.secret },
      { slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG' },
    );
    const { body, headers, status: statutBrut } = await handler(context.request);
    const status = statutBrut ?? 200;
    if (estRetourGithub && status >= 400) {
      console.error('[admin] Échec de la connexion GitHub', status, typeof body === 'string' ? body : '');
      return page(
        'La connexion n\'a pas abouti',
        `<p>GitHub a bien répondu, mais le site n'a pas pu finaliser la connexion. Voici l'état des réglages :</p>${await rapport(c)}
<p>Si tous les réglages sont OK, il s'agit souvent d'un lien de connexion utilisé deux fois ou trop ancien : recommencez simplement.</p>
<a class="btn" href="/keystatic">Réessayer</a>`,
        status,
      );
    }
    return new Response(body as BodyInit, { status, headers: headers as HeadersInit });
  } catch (erreur) {
    console.error('[admin] Erreur de l\'API Keystatic', erreur);
    return page(
      'L\'administration a rencontré un problème',
      `<p>Voici l'état des réglages :</p>${await rapport(c)}<a class="btn" href="/keystatic">Réessayer</a>`,
      500,
    );
  }
});
