# Mise en ligne et branchement de l'administration

Ce guide se suit une seule fois, par la personne qui installe le site. Il demande un compte GitHub (propriétaire du dépôt) et un compte Cloudflare gratuit. Comptez une heure.

Le principe : le site public est fait de pages statiques hébergées sur Cloudflare. L'administration (`/keystatic`) enregistre chaque modification sous forme de commit dans le dépôt GitHub. Cloudflare voit ce commit, reconstruit le site et le remet en ligne, en deux à cinq minutes.

## 1. Choisir la branche de production

Keystatic enregistre dans la branche par défaut du dépôt GitHub, et Cloudflare publie une branche que vous choisissez. Les deux doivent être la même.

La branche `main` existe. Faites-en la branche par défaut : GitHub, dépôt, Settings, General, Default branch, choisir `main`. Les évolutions du site arrivent dans `main` par des pull requests.

## 2. Créer le site sur Cloudflare

1. Cloudflare, Workers & Pages, Create, Import a repository.
2. Choisir le dépôt `nathanayubu03-code/RAPDFEM` et la branche de production.
3. Build command : `npm run build`. Deploy command : `npx wrangler deploy`.
4. Dans Build variables, ajouter `NODE_VERSION` = `22.23.4` (Astro 7 refuse les versions plus anciennes).
5. Lancer le premier déploiement. Cloudflare donne une adresse en `.workers.dev`. Notez-la.

Le stockage KV nommé `SESSION` est créé automatiquement au premier déploiement.

## 3. Créer l'application GitHub de Keystatic

Keystatic a besoin d'une « GitHub App » pour que les administrateurs se connectent avec leur compte GitHub et écrivent dans le dépôt.

GitHub, photo de profil, Settings, Developer settings, GitHub Apps, New GitHub App :

- GitHub App name : par exemple `rapdfem-admin`. Ce nom est le « slug » de l'étape 4.
- Homepage URL : l'adresse du site.
- Callback URL : `https://ADRESSE-DU-SITE/api/keystatic/github/oauth/callback`. Ajoutez une ligne par adresse utilisée (l'adresse `.workers.dev` et le nom de domaine définitif).
- Cocher « Request user authorization (OAuth) during installation ».
- Webhook : décocher « Active ».
- Repository permissions : Contents en Read and write, Metadata en Read-only, Pull requests en Read and write.
- Where can this GitHub App be installed : Only on this account.

Après création : noter le Client ID, cliquer « Generate a new client secret » et noter le secret, puis « Install App » sur le dépôt RAPDFEM seulement.

## 4. Donner les clés à Cloudflare

Cloudflare, le Worker `rapdfem`, Settings.

Dans Variables and Secrets (type Secret) :

- `KEYSTATIC_GITHUB_CLIENT_ID` : le Client ID de l'application GitHub.
- `KEYSTATIC_GITHUB_CLIENT_SECRET` : le client secret.
- `KEYSTATIC_SECRET` : une longue chaîne aléatoire, par exemple le résultat de `openssl rand -hex 32`.

Dans Build, Variables and secrets (variable de build, lue pendant la construction) :

- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` : le nom de l'application GitHub, par exemple `rapdfem-admin`.

Relancer un déploiement pour que la variable de build soit prise en compte.

## 5. Vérifier

1. Ouvrir `https://ADRESSE-DU-SITE/keystatic`, cliquer « Log in with GitHub », autoriser.
2. Ouvrir Réglages du site, modifier un téléphone, cliquer « Save ».
3. Sur GitHub, un nouveau commit apparaît dans la branche de production.
4. Sur Cloudflare, un nouveau build démarre. Quand il est terminé, le téléphone modifié apparaît dans le pied de page.
5. Remettre le téléphone d'origine.

Pour ajouter un autre administrateur : l'inviter comme collaborateur du dépôt sur GitHub (Settings, Collaborators). Il pourra ensuite se connecter à `/keystatic`.

## 6. Reconstruction quotidienne (offres clôturées)

Une offre passe dans « offres clôturées » le lendemain de sa date limite. Pour que ça se fasse sans intervention, le fichier `.github/workflows/reconstruction-quotidienne.yml` reconstruit et republie le site chaque nuit à 00 h 07, heure de Goma.

Il a besoin de trois réglages dans GitHub, dépôt, Settings, Secrets and variables, Actions :

- Secret `CLOUDFLARE_API_TOKEN` : un jeton créé dans Cloudflare, My Profile, API Tokens, modèle « Edit Cloudflare Workers ».
- Secret `CLOUDFLARE_ACCOUNT_ID` : l'identifiant du compte, visible sur la page d'accueil Workers & Pages.
- Variable (onglet Variables) `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` : le même nom d'application GitHub qu'à l'étape 4.

Pour tester : GitHub, onglet Actions, « Reconstruction quotidienne », Run workflow.

## Travailler en local

```bash
npm install
npm run dev
```

L'administration locale est sur http://localhost:4321/keystatic. En local, Keystatic écrit directement dans les fichiers du dépôt, sans passer par GitHub.

## Limites de taille

Keystatic ne sait pas refuser un fichier trop lourd au moment du téléversement. Le build vérifie donc toutes les images (3 Mo maximum) et tous les PDF (10 Mo maximum). Si un fichier dépasse, la publication est bloquée et le journal de build Cloudflare nomme le fichier en cause. Le site en ligne reste alors dans son état précédent.
