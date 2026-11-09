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
2. Ouvrir Identité, puis Logo et coordonnées, modifier un téléphone, cliquer « Sauvegarder ».
3. Sur GitHub, un nouveau commit apparaît dans la branche de production.
4. Sur Cloudflare, un nouveau build démarre. Quand il est terminé, le téléphone modifié apparaît dans le pied de page.
5. Remettre le téléphone d'origine.

Pour ajouter un autre administrateur : l'inviter comme collaborateur du dépôt sur GitHub (Settings, Collaborators). Il pourra ensuite se connecter à `/keystatic`.

## 6. Reconstruction quotidienne (offres clôturées)

Une offre passe dans « offres clôturées » le lendemain de sa date limite. Pour que ça se fasse sans intervention, la tâche GitHub `Reconstruction quotidienne` demande chaque nuit à Cloudflare de reconstruire le site (00 h 07, heure de Goma). Réglage unique :

1. Cloudflare, Workers & Pages, rapdfem, Settings, partie Builds, bloc **Deploy Hooks** : créer un hook (nom : `quotidien`, branche : la branche de production). Copier l'adresse obtenue.
2. GitHub, dépôt, Settings, Secrets and variables, Actions, **New repository secret** : nom `CLOUDFLARE_DEPLOY_HOOK`, valeur : l'adresse copiée.
3. Pour tester : onglet Actions, « Reconstruction quotidienne », Run workflow. Un nouveau build doit apparaître dans Cloudflare.

Tant que ce secret n'existe pas, la tâche s'arrête proprement, sans erreur.

## 7. Les garde-fous

Trois protections empêchent qu'une erreur de saisie bloque le site :

- **Avant chaque construction**, `scripts/preparer-contenu.mjs` contrôle chaque image et chaque PDF du contenu. Une photo au format iPhone (HEIC), abîmée ou supprimée est mise de côté pour cette publication, et le reste du site est publié normalement. Le journal de build Cloudflare indique quoi corriger dans l'admin.
- **Après chaque construction**, `scripts/verifier-site.mjs` contrôle toutes les pages : liens internes, version française et anglaise, un seul grand titre, texte alternatif des images, aucune valeur technique affichée (« undefined »…).
- **À chaque modification**, la tâche GitHub `Contrôle du site` refait tout ça et affiche une coche verte ou une croix rouge dans l'onglet Actions. Une croix rouge ne touche pas le site en ligne.

Si un build Cloudflare échoue malgré tout, **la version précédente du site reste en ligne** : rien ne disparaît. Pour être prévenu par e-mail : Cloudflare, Notifications, Add, « Workers Builds », événement « Build failed ».

## Travailler en local

```bash
npm install
npm run dev
```

L'administration locale est sur http://localhost:4321/keystatic. En local, Keystatic écrit directement dans les fichiers du dépôt, sans passer par GitHub.

## Limites de taille

Keystatic ne sait pas refuser un fichier trop lourd au téléversement. Le build signale donc dans son journal les images de plus de 3 Mo et les PDF de plus de 10 Mo, sans bloquer : les images sont de toute façon réduites. Seul un PDF de plus de 25 Mo bloque, parce que Cloudflare le refuserait.
