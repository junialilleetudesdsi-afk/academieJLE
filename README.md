# Académie JLE

Académie de Junia Lille Études : Next.js / React, Better Auth et PostgreSQL, compatible Neon et Vercel.

## Fonctionnalités

- 35 fiches consultables, recherche dans les textes et filtres organisation/trésorerie.
- 500 questions, dont 250 en organisation et 250 en trésorerie, une bonne réponse, une explication et un lien Kiwi par question.
- Quiz express, entraînement par domaine ou fiche, révision des dernières erreurs.
- Test blanc pédagogique : 30 questions équilibrées, 30 minutes, correction finale ; les fiches sont diversifiées dans chaque domaine. Format JLE non officiel CNJE.
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

La [revue éditoriale](docs/content-review.md) documente les 11 PDF, le support WEFAH 2023 et les critères de vérification. Les 422 ajouts comprennent 110 questions de cours et 312 exercices répartis en 39 familles de cas. Chaque variante comporte une situation ou des données à analyser. La veille Kiwi n’est pas automatisée : les montants annuels et nouveautés doivent être révisés régulièrement.

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

## Version novembre 2026 : flashcards, process, formations et administration

Les 500 questions alimentent un mode flashcards (domaine/fiche/volume, retournement, auto-évaluation, reprise des cartes à revoir). Ce mode ne crée aucun faux résultat de test. Le sélecteur des parcours disparaît pendant un quiz et sur sa correction, et le focus revient à la question lors du passage à la suivante.

`content/processes.json` contient la cartographie dynamique, 39 process avec lien, un process Présidence « à venir » et les deux accès rapides. Les 41 URL ont été décodées des QR du PDF, puis associées aux blocs par leur position. Les autorisations Google Drive des documents ne changent pas. Un bloc ou une URL peut être modifié dans ce fichier sans refaire le composant.

`content/formations.json` répertorie les sept formations avec leurs repères et points de vigilance ; elles apparaissent aussi dans Connaissances. Les PDF sont conservés intégralement (toutes les pages) et la formation ProG est optimisée pour le Web. Les formations se consultent uniquement en PDF, avec téléchargement et ouverture dans un nouvel onglet. Les commentaires de vigilance ne sont pas affichés dans le lecteur ; les repères présents dans Connaissances et les liens vers les fiches associées sont conservés ; les supports ne sont pas ajoutés comme questions validées au catalogue.

Les routes `/api/materials/[id]` servent les PDF et les transcriptions depuis la table privée `jle_materials` dans Neon uniquement après contrôle de session, avec interdiction de cache partagé. **Aucun PDF ni transcription intégrale n’est versionné dans GitHub.** Le dépôt ne contient que les descriptifs, les repères et le manifeste des documents. Un compte créé librement ne constitue pas une validation d’appartenance à JLE.

### Importer les PDF depuis le site (sans terminal)

Une fois connecté avec un compte présent dans `ADMIN_USER_IDS`, ouvrir **Administration → Formations**.

- **Supports JLE préparés** : extraire le ZIP `Academie_JLE_Formations_Import_Neon.zip` avec l’explorateur Windows, puis sélectionner les sept `.pdf` en une seule fois. Cliquer sur **Importer les supports**. Chaque document est traité séparément ; les erreurs éventuelles sont indiquées fichier par fichier et les réussites restent enregistrées. Relancer un import ne crée pas de doublons.
- **Nouvelle formation** : sélectionner un PDF, indiquer son titre, son thème et sa description, puis cliquer sur **Ajouter la formation**. La formation apparaît immédiatement dans Formations et sa présentation dans Connaissances, sans changement GitHub ni redéploiement. La consultation se fait en PDF ; aucun texte ni question n’est inventé à partir du titre.

Limite applicative : **4 000 000 octets par PDF**, pour rester compatible avec les limites Vercel de requête et de réponse du projet. Réduire les fichiers plus volumineux avant l’import ; les sept PDF du ZIP fourni respectent déjà la limite. Les transcriptions historiques sont conservées pour compatibilité avec l’ancien import, mais aucun sélecteur ni lecteur texte n’est proposé sur le site. Les PDF nouveaux sont analysés pour refuser les fichiers illisibles, protégés et de plus de 500 pages. Le lot préparé est reconnu par ses empreintes SHA-256.

L’API d’import vérifie la session et l’identifiant administrateur côté serveur, ainsi que l’origine de la requête avant de lire le document. Les PDF et les transcriptions sont stockés dans Neon, jamais dans GitHub. La colonne JSONB `metadata` est ajoutée automatiquement à `jle_materials`, y compris sur une base déjà initialisée. Le script `npm run formations:import -- "chemin/du/dossier/extrait"` reste disponible en option, pour le lot initial uniquement.

Avant l’import, le lecteur indique que le support n’est pas disponible. Aucun compte ni résultat de test n’est modifié par un import. Les importations et la consultation en conditions réelles nécessitent la configuration Neon et un compte autorisé.

### Ajouter manuellement un administrateur

1. Le membre crée son compte, se connecte et copie « Mon identifiant de compte », dans l’onglet **Mon compte** uniquement. Le gestionnaire peut aussi retrouver `id`, `name` et `email` dans la table Better Auth `user` de Neon, en vérifiant l’identité du membre.
2. Dans Vercel → projet → Settings → Environment Variables, ajouter **`ADMIN_USER_IDS`** avec cet identifiant exact. Pour plusieurs comptes : `identifiant1,identifiant2`. Sélectionner l’environnement Production (et Preview seulement si souhaité).
3. Redéployer la version courante. Le membre recharge le site ; l’onglet Administration apparaît. Pour retirer un accès, supprimer l’identifiant de la variable et redéployer.

Aucun compte n’est automatiquement administrateur. Il n’y a pas de règle « premier inscrit », pas d’auto-promotion et pas de liste d’e-mails non vérifiés. Les droits sont vérifiés à chaque appel API au moyen de la session serveur ; modifier le navigateur ou un paramètre ne permet pas de devenir administrateur.

L’administrateur consulte les comptes (y compris sans résultat), les dates d’inscription, les e-mails et leur état de vérification, puis les résultats paginés de chaque compte, leurs modes, dates, durées et réponses. Aucun mot de passe, hash ni token de session n’est transmis. Les autres membres ne peuvent pas accéder à ces données. Les vues statistiques et la pagination concernent les résultats de test enregistrés, pas les auto-évaluations des flashcards.

Validation : tests de contenu, de sélection, de notation, de contrôle des accès et d’import ; compilation Next.js. La prévisualisation navigateur locale a été bloquée par l’incompatibilité du lanceur de preview avec les arguments Next.js. À vérifier après déploiement : un quiz connecté, une formation après import et la consultation des résultats avec un ID administrateur autorisé.

## Questions des formations internes au 27 novembre 2026

Le catalogue v4 contient 570 questions : les 500 initiales et 70 nouveaux QCM à réponse unique, dix pour chacun des sept supports fournis. Chaque nouvelle question précise `formationId`, `formationPage`, `formationCheckedAt` et `kiwiVerified`. Les questions sont reformulées ; aucun PDF interne complet n’est publié dans le dépôt.

Depuis Formations, les boutons « Quiz sur cette formation » et « Flashcards de cette formation » ouvrent une sélection ciblée. Le mode « Par formation » et les filtres Formation permettent aussi de choisir un support dans les entraînements et les flashcards. Les PDF ajoutés ultérieurement ne génèrent pas automatiquement des questions.

Les repères internes et les pratiques de gestion renvoient au support PDF, sans leur attribuer abusivement une validation Kiwi. Les questions réglementaires sont rapprochées des fiches Kiwi lues au 27/11/2026. Les anciennes règles non retenues comprennent les seuils historiques, les taux, les déclaratifs datés et les raccourcis sur les signatures. Les erreurs d’inégalité de TVA et l’assimilation du résultat aux flux bancaires ont été corrigées. La bibliographie détaillée est dans `docs/formation-question-review.md`.

Le test blanc conserve 30 questions, quinze par domaine. Les questions de formation purement internes ou historiques en sont exclues ; les quiz de formation et les flashcards les proposent. Les données et réponses des 500 questions initiales ne sont pas modifiées par cet ajout.
