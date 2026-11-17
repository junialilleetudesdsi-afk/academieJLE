# Knowledge JLE

Académie de Junia Lille Études. Next.js / React, Better Auth et PostgreSQL (Neon compatible).

## Démarrage

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Sans configuration PostgreSQL, le site reste explorable mais les comptes sont explicitement désactivés. Aucun faux compte ni mot de passe n'est enregistré dans le navigateur.

## Mise en production Vercel + Neon

1. Importer ce dépôt GitHub dans Vercel (framework Next.js).
2. Créer une base PostgreSQL Neon, idéalement en région UE, et configurer `DATABASE_URL` dans Vercel.
3. Générer un secret aléatoire de 32 caractères minimum pour `BETTER_AUTH_SECRET`.
4. Configurer `BETTER_AUTH_URL` avec l'URL HTTPS définitive du site.
5. Appliquer le schéma Better Auth avant d'ouvrir les comptes : avec les mêmes variables exportées dans le terminal, exécuter `npm run auth:migrate -- --config lib/auth.ts`. Le CLI peut demander confirmation. Ne jamais committer les secrets.
6. Redéployer Vercel puis vérifier inscription, connexion et déconnexion avec un compte de test.

La création de compte est ouverte. Un compte n'atteste pas l'appartenance à JLE. Avant publication de contenus internes, ajouter une validation membre/invitation et protéger leur accès côté serveur. Les contenus JSON du dépôt doivent rester non confidentiels : ils sont publics dans le code livré au navigateur.

## Contenus

`content/catalog.json` est le catalogue versionné, vide volontairement. Les compteurs sont lus depuis ce fichier. Les parcours et la bibliothèque présentent des états vides honnêtes. L'affichage des futures fiches, le moteur de questions et l'enregistrement des résultats sont la prochaine étape ; ajouter des objets au JSON seul ne les activera pas encore.

Prévoir pour les fiches : id, titre, thème, corps, URL source, date de vérification, statut de validation. Pour les questions : id, thème, niveau, énoncé, choix, réponse, explication, source et statut.

Les comptes/sessions sont dans PostgreSQL, jamais dans GitHub. Les futurs résultats devront suivre le même principe. Aucun score fictif. Aucun contenu CNJE reproduit.

## Périmètre livré

- Tableau de bord responsive, identité JLE, logo officiel téléchargé depuis le site JLE.
- Bibliothèque : recherche et filtres, état vide.
- Trois entrées d'entraînement avec présentation (pas de questions pour l'instant).
- Espace progression avec état vide.
- Formulaires connexion/inscription et API Better Auth ; mot de passe 12 caractères minimum, limitation des requêtes via PostgreSQL.
- Pas encore de récupération de mot de passe, vérification e-mail, rôles administrateur ni historique des entraînements : prévoir avant ouverture large.

## Vérification

`npm run build` et `npm run typecheck`.

Le déploiement et la base appartiennent à JLE : prévoir une passation des accès et un budget hébergement, puis une politique de sauvegarde et de conservation des données.
