# Guide de l'administration du site RAPDFEM

Ce guide explique comment modifier le site sans toucher au code. Il est écrit pour une personne qui n'a jamais fait de site web.

L'administration se trouve à l'adresse du site suivie de `/keystatic`, par exemple `https://www.rapdfem.org/keystatic`.

## 1. Le principe en deux phrases

Tout ce que vous écrivez dans l'administration est enregistré, puis le site se reconstruit tout seul. Deux à cinq minutes après avoir cliqué sur « Sauvegarder », la modification est visible sur le site public.

Un contenu n'apparaît sur le site que si la case **Publié** est cochée. Tant qu'elle est décochée, c'est un brouillon que seules les personnes de l'administration voient.

## 2. Se connecter

L'administration utilise des comptes GitHub. GitHub est le service qui garde une copie de tout le site et de son historique. Chaque personne a son propre compte, gratuit, avec son adresse e-mail et son mot de passe. Personne n'a besoin du compte de quelqu'un d'autre.

### La première fois

1. Créez un compte gratuit sur https://github.com/signup avec votre adresse e-mail et un mot de passe de votre choix.
2. Envoyez votre nom d'utilisateur GitHub à la personne qui gère le site.
3. Vous recevez un e-mail « invitation to collaborate on RAPDFEM ». Cliquez sur « Accept invitation ».
4. Ouvrez l'adresse du site suivie de `/keystatic`.
5. Cliquez sur « Log in with GitHub », puis sur « Authorize ». Cette autorisation n'est demandée qu'une fois.

### Les fois suivantes

Ouvrez l'adresse `/keystatic`. Si vous êtes déjà connecté à GitHub dans ce navigateur, l'administration s'ouvre directement. Sinon, GitHub vous demande votre e-mail et votre mot de passe.

### Donner l'accès à une nouvelle personne (pour la personne qui gère le site)

1. Sur GitHub, ouvrez le dépôt RAPDFEM, puis Settings, puis Collaborators.
2. Cliquez sur « Add people » et tapez le nom d'utilisateur GitHub de la personne.
3. Elle reçoit l'invitation par e-mail et suit les étapes de « La première fois ».

Pour retirer l'accès à quelqu'un : même endroit, bouton « Remove » à côté de son nom. Son accès est coupé aussitôt, sans changer le mot de passe des autres.

## 3. L'écran de l'administration

À gauche, le menu liste tout ce que vous pouvez modifier :

- **Le réseau** : Projets, Activités, Zones d'intervention, Équipe, Partenaires.
- **Actualité** : Actualités, Événements, Galerie photos.
- **Documents et offres** : Offres, Rapports et publications, Questions fréquentes.
- **Identité** : Logo et coordonnées (logo de l'ONG, favicon, adresses, téléphones, courriels, réseaux sociaux), et Faire un don (coordonnées bancaires).
- **Textes du site** : Présentation du réseau (textes de l'accueil et de la page À propos).

Quelques boutons restent en anglais, parce que l'outil n'est pas entièrement traduit :

| Bouton | Signification |
|---|---|
| Choose file | Choisir un fichier sur l'ordinateur |
| Unsaved | Modifications pas encore enregistrées |
| Regenerate | Recréer l'adresse de la page à partir du titre |
| Log in with GitHub | Se connecter |

## 4. Règles valables partout

- **Français obligatoire, anglais facultatif.** Si l'anglais est vide, la version anglaise du site affiche le texte français avec un petit bandeau.
- **Texte alternatif obligatoire.** Pour chaque image, écrivez en une phrase ce qu'elle montre, par exemple « Femmes médiatrices réunies au centre de Turunga ». Ce texte est lu aux personnes aveugles. S'il est oublié, la publication passe quand même et le site utilise le titre à la place, mais un vrai texte est préférable.
- **Images de 3 Mo maximum conseillés, PDF de 10 Mo maximum conseillés.** Une image plus lourde est quand même publiée (le site la réduit), mais l'envoi est plus long. Un PDF de plus de 25 Mo est refusé par l'hébergement. Une photo de téléphone fait souvent 3 à 6 Mo : réduisez-la d'abord, par exemple avec https://squoosh.app ou en l'envoyant par WhatsApp à vous-même.
- **Formats de photo : JPG, PNG ou WebP.** Les photos d'iPhone au format HEIC ne sont pas lisibles par le site : elles sont mises de côté et n'apparaissent pas. Sur iPhone, choisissez « Le plus compatible » dans Réglages, Appareil photo, Formats ; ou envoyez-vous la photo par WhatsApp, qui la convertit en JPG.
- **Consentement.** Ne publiez une photo de personnes que si elles ont donné leur accord.
- **Un champ vide n'affiche rien.** Vous pouvez laisser vide tout ce que vous ne connaissez pas.

## 5. Ajouter et publier un projet

Les 13 projets du réseau existent déjà en brouillon, avec leur titre. Il reste à écrire leur contenu.

1. Menu de gauche, **Projets**. Cliquez sur le projet.
2. **Image principale** : « Choose file », choisissez la photo, puis écrivez le texte alternatif en français.
3. **Contenu en français** : écrivez librement. La barre d'outils permet de mettre des titres (par exemple « Objectifs », « Résultats »), du gras, des listes, des liens et des images.
4. **Contenu en anglais** : facultatif.
5. **Photos** : cliquez sur « Ajouter » pour chaque photo, une par une.
6. **Ordre d'affichage** : les petits nombres apparaissent en premier sur la page Projets.
7. Cochez **Publié**.
8. Cliquez sur **Sauvegarder** en haut à droite.

Pour un nouveau projet : bouton **Ajouter** en haut de la liste des projets, puis les mêmes étapes. Le bouton s'appelle « Créer » au moment du premier enregistrement.

## 6. Publier une actualité

1. **Actualités**, puis **Ajouter**.
2. Titre, date, résumé de deux ou trois phrases (affiché dans les listes), image principale, puis le texte de l'article.
3. **Projet lié** : facultatif. Si vous choisissez un projet, l'actualité apparaît aussi sur la page de ce projet.
4. Cochez **Publié**, puis cliquez sur **Créer**.

Les trois dernières actualités publiées apparaissent sur la page d'accueil.

## 7. Ajouter des photos

Il y a deux façons, selon l'usage :

- **Photos d'un projet, d'une activité ou d'une offre** : ouvrez l'élément, section « Photos », bouton « Ajouter », une photo à la fois.
- **Galerie photos** : menu **Galerie photos**, puis **Ajouter**. Une entrée correspond à une photo, avec son titre, sa légende et sa date. Vous pouvez la relier à un projet ou à un événement : elle apparaît alors aussi sur la page du projet. Les photos publiées s'affichent sur la page **Galerie** du site (dans le menu principal) et les six plus récentes sur l'accueil.

L'outil ne permet pas d'envoyer plusieurs photos d'un seul coup.

## 8. Publier une offre (emploi, stage, appel d'offres)

1. **Offres**, puis **Ajouter**.
2. Titre, par exemple « Stage en communication » ou « Appel d'offres : construction d'un pavillon ».
3. **Date limite** : le lendemain de cette date, l'offre passe toute seule dans « Offres clôturées ». Sans date, elle reste ouverte jusqu'à ce que vous la dépubliiez.
4. **Contenu** : écrivez librement de quoi il s'agit, le profil recherché, comment postuler, l'adresse e-mail de candidature.
5. **Document PDF** : facultatif, par exemple les termes de référence.
6. Cochez **Publié**, puis cliquez sur **Créer**.

## 9. Publier un rapport

1. **Rapports et publications**, puis **Ajouter**.
2. Titre, année, type (écrivez librement : rapport annuel, étude…), résumé.
3. **Fichier PDF** : obligatoire pour que le rapport s'affiche. Le site montre le poids du fichier à côté du lien.
4. Cochez **Publié**, puis cliquez sur **Créer**.

Les politiques internes (égalité de genre, PSEA…) se trouvent dans **Présentation du réseau**, en bas. Chacune apparaît sur la page « Publications et transparence » dès que son PDF est ajouté.

## 10. Changer le logo ou les coordonnées

Menu **Identité**, puis **Logo et coordonnées**. Le logo est le premier champ en haut de la page :

- **Logo de l'ONG** : celui de l'en-tête. Format PNG avec fond transparent, carré, au moins 400 × 400 pixels. Pour le remplacer, cliquez sur le petit bouton de suppression de l'image actuelle, puis sur « Choose file ».
- **Logo pour fond sombre** : celui du pied de page, sur fond noir. S'il est vide, le logo principal est utilisé.
- **Favicon** : la petite icône de l'onglet du navigateur.
- **Image de partage** : l'image qui s'affiche quand on partage le site sur WhatsApp ou Facebook.
- **Adresses des bureaux**, **Téléphones**, **Courriels**, **Réseaux sociaux** : ajoutez, modifiez ou supprimez une ligne.

Cliquez sur **Sauvegarder**. Les coordonnées changent partout à la fois : en-tête, pied de page, page Contact.

Les textes de l'accueil et de la page À propos (accroche, chiffres clés, mission, vision, axes) se changent dans **Présentation du réseau**.

## 11. Modifier la page « Faire un don »

Menu **Identité**, puis **Faire un don (coordonnées bancaires)**.

- **Texte d'introduction** : facultatif. S'il est vide, le site affiche une phrase standard.
- **Comptes bancaires** : un bloc par compte, avec la banque, l'intitulé, le numéro, le code SWIFT et la devise. Cliquez sur « Ajouter » pour un deuxième compte (par exemple en francs congolais), ou sur la corbeille pour en retirer un.

Vérifiez chaque chiffre avant de sauvegarder : ces coordonnées sont publiques et servent aux donateurs.

## 12. Dépublier ou supprimer un contenu

- **Dépublier** (le cacher sans le perdre) : ouvrez l'élément, décochez **Publié**, cliquez sur **Sauvegarder**. Il disparaît du site mais reste dans l'administration.
- **Supprimer** définitivement : ouvrez l'élément, cliquez sur l'icône de corbeille en haut à droite, puis confirmez.

Avant de supprimer un projet, vérifiez qu'aucune actualité, activité ou photo de la galerie n'y est reliée. Sinon, changez d'abord le lien dans ces éléments.

## 13. La publication n'apparaît pas après quelques minutes

Suivez ces étapes dans l'ordre :

1. **La case Publié est-elle cochée ?** Ouvrez l'élément et vérifiez.
2. **Avez-vous cliqué sur Sauvegarder ?** Si « Unsaved » est affiché en haut, la modification n'est pas enregistrée.
3. **Attendez cinq minutes**, puis rechargez la page du site en appuyant sur Ctrl + F5 (ou en tirant la page vers le bas sur un téléphone).
4. **Ouvrez toujours l'administration par l'adresse qui finit par `/keystatic`**, sans rien après. N'utilisez pas un ancien favori qui contient `/branch/main` : ce qui est enregistré sur une autre branche n'est jamais publié.
5. **Si l'administration bloque ou affiche « Internal error »**, ouvrez-la dans une fenêtre de navigation privée (Ctrl + Maj + N). Si ça marche là, videz les données du site dans votre navigateur habituel : icône à gauche de l'adresse, « Paramètres du site », « Supprimer les données ». Puis reconnectez-vous.
6. **Une photo n'apparaît pas alors que le reste est publié ?** Elle a sans doute été mise de côté : format HEIC, fichier abîmé, ou fichier supprimé. Supprimez-la dans l'admin et téléversez-la à nouveau en JPG.
7. **Si rien ne marche**, la personne qui gère le site peut lire le message d'erreur exact. Sur Cloudflare : Workers & Pages, rapdfem, Deployments, puis le dernier déploiement en rouge. Le message nomme le fichier en cause.

## 14. Bonnes pratiques

- Écrivez d'abord en brouillon (case **Publié** décochée), relisez, puis publiez.
- Une personne à la fois sur le même élément. Si deux personnes modifient le même projet au même moment, la deuxième sauvegarde peut être refusée : rechargez la page et recommencez.
- Ne publiez jamais de coordonnées bancaires ni d'informations personnelles sur les bénéficiaires.
