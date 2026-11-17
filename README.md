# Académie JLE

Académie de Junia Lille Études : Next.js / React, Better Auth et PostgreSQL, compatible Neon et Vercel.

## Fonctionnalités

- 12 fiches consultables, recherche dans les textes et filtres organisation/trésorerie.
- 78 questions vérifiées, une bonne réponse, une explication et un lien Kiwi par question.
- Quiz express, entraînement par domaine ou fiche, révision des dernières erreurs.
- Test blanc pédagogique : 30 questions équilibrées, 30 minutes, correction finale. Format JLE non officiel CNJE.
- Résultats calculés côté serveur, historique privé par compte, statistiques par domaine.
- Mode invité avec correction, explicitement sans sauvegarde.
- Identité JLE et affichage mobile ; inscription et connexion Better Auth existantes conservées.

## Démarrage

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Sous PowerShell, utiliser `Copy-Item .env.example .env.local`. Sans PostgreSQL configuré, les contenus et les entraînements invités fonctionnent ; les comptes sont désactivés.

## Vercel et Neon déjà configurés

Aucune nouvelle variable d’environnement n’est nécessaire pour cette version. Conserver `DATABASE_URL`, `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` (l’URL HTTPS finale). Le déploiement suit la branche configurée dans Vercel, généralement `main`.

La table `jle_attempts` est créée automatiquement au premier accès authentifié à l’historique ou à sa sauvegarde, avec `CREATE TABLE IF NOT EXISTS`. Le rôle PostgreSQL utilisé par l’application doit pouvoir créer cette table dans son schéma. Les tables et comptes Better Auth existants ne sont ni effacés ni recréés. Si le rôle est restreint, un administrateur peut appliquer le même schéma défini dans `lib/db.ts` avant le déploiement.

Après déploiement, réaliser un quiz connecté, vérifier le message « Résultat enregistré dans votre compte », puis consulter Ma progression depuis une nouvelle session. Un échec d’enregistrement laisse la correction visible avec un bouton pour réessayer ; aucune réussite de sauvegarde n’est simulée.

Pour une nouvelle installation, appliquer également le schéma Better Auth correspondant à la version installée avant d’ouvrir les comptes. Ne jamais committer `.env.local` ni un secret.

## Contenus et maintenance

Le catalogue versionné est `content/catalog.json`. Les questions référencent une fiche par `articleId`, laquelle fournit la source Kiwi, sa date de mise à jour et la date de vérification. Les identifiants de questions doivent rester stables ; pour changer le sens d’une question, créer un nouvel identifiant. Seul le statut `verified` entre dans les parcours. Le site contient des synthèses, pas les PDF complets.

La [revue éditoriale](docs/content-review.md) documente le traitement des 11 PDF, les doublons, les corrections et les sujets laissés en attente de vérification. Ce lot n’est pas une conversion exhaustive des PDF. La veille Kiwi n’est pas automatisée : les montants annuels et nouveautés doivent être révisés régulièrement.

Les comptes et résultats sont dans PostgreSQL, jamais dans GitHub. Le catalogue est public dans le dépôt et dans le code navigateur. Il ne doit contenir aucune donnée interne ou personnelle. La création de compte reste ouverte : un compte n’atteste pas l’appartenance à JLE. Les invitations, rôles administrateur, récupération de mot de passe et validation d’e-mail ne sont pas ajoutés dans ce lot.

## Historique et notation

Les API utilisent exclusivement l’identité de la session serveur, jamais un identifiant utilisateur soumis par le navigateur. Le score est recalculé à partir du catalogue. Un identifiant de tentative rend les nouvelles soumissions idempotentes pour un compte. Les requêtes étrangères sont rejetées et les réponses d’API ne sont pas mises en cache.

Les statistiques portent sur les 200 dernières tentatives. Les résultats conservent la version du catalogue et le verdict initial ; les explications affichées sont celles du catalogue courant. La révision d’erreurs choisit les questions dont la dernière réponse enregistrée est incorrecte. Une session en cours n’est pas conservée après rechargement : un avertissement navigateur est déclenché. En test blanc, l’échéance utilise une heure absolue pour gérer les onglets en arrière-plan ; un score d’entraînement ne constitue pas une attestation d’examen surveillé.

## Vérification

```sh
npm test
npm run typecheck
npm run build
```

Les tests couvrent les invariants du catalogue, la notation, les filtres, la sélection équilibrée et le rejet des soumissions invalides. La vérification interactive Chromium n’a pas pu être exécutée dans cet environnement (création de socket refusée) ; prévoir un contrôle visuel desktop et mobile après déploiement. La connexion à la base Neon de production doit être contrôlée après déploiement avec un compte de test ; aucun accès à cette base n’est requis pour compiler.
