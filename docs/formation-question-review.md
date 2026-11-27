# Questions des formations internes du 27 novembre 2026

Le catalogue v4 ajoute 70 questions, dix pour chacun des sept PDF fournis par JLE. Le contenu est reformulé, avec une seule bonne réponse et une explication. Les 500 questions initiales sont conservées intégralement. Le champ `verified` reste un état interne de publication, pas une validation CNJE ni un visa de relecture indépendante.

## Supports et couverture

| Identifiant | Support | Questions |
| --- | --- | --- |
| mouvement | Formation Mouvement.pdf | 10 |
| poles | Formation Présentation des pôles.pdf | 10 |
| sde | Formation SDE.pdf | 10 |
| ga | Formation GA.pdf | 10 |
| legal | Formation Cadre légal.pdf | 10 |
| tresorerie | Formation Trésorerie.pdf | 10 |
| prog | Cours recap ProG.pdf, édition 2023 | 10 |

Les métadonnées de chaque question donnent le nom du PDF, le numéro de page dans le fichier, `formationId`, `formationPage` et la date de préparation. Les repères internes sont présentés selon le support, sans réutiliser les noms de responsables ni les outils d’un ancien mandat comme situation actuelle.

## Vérification des questions réglementaires

27 questions sont rapprochées des fiches Kiwi suivantes, lues le 27/11/2026. Les 43 autres sont des pratiques ou repères issus des formations ; leur source affichée est le PDF. Leur fiche de rattachement sert de thème de classement et n’est pas présentée comme preuve Kiwi de ces pratiques.

- Code de la Déontologie : https://legal.junior-entreprises.com/a/code-de-la-deontologie (mise à jour 16/03/2026).
- Statuts et Règlement intérieur : https://legal.junior-entreprises.com/a/statuts-et-reglement-interieur (23/10/2026).
- Réunions : https://legal.junior-entreprises.com/a/reunions-2 (22/07/2026).
- Respecter le RGPD en cinq étapes : https://legal.junior-entreprises.com/a/respecter-le-rgpd-en-cinq-etapes (28/02/2026).
- Bases et principes d’une comptabilité : https://legal.junior-entreprises.com/a/bases-et-principes-dune-comptabilite (16/06/2026).
- Taxe sur la Valeur Ajoutée : https://legal.junior-entreprises.com/a/taxe-sur-la-valeur-ajoutee-tva (08/09/2026).
- Facturation d’une étude : https://legal.junior-entreprises.com/a/facturation-dune-etude (16/06/2026).
- Bulletin de versement : https://legal.junior-entreprises.com/a/bulletin-de-versement-bv (03/08/2026).

Le crédit de TVA est bien obtenu lorsque la déductible admissible dépasse la collectée, contrairement à l’inégalité du support Trésorerie page 20. Le résultat comptable n’est pas assimilé aux seuls flux bancaires, contrairement au raccourci de sa page 21. L’acompte n’est pas obligatoire. Les conditions de BV sont celles de la fiche lue. Le moyen mnémotechnique RGPD n’est pas considéré comme liste exhaustive des droits.

Les taux et plafonds historiques, les prix JEH anciens, la composition nominative des équipes, les anciennes listes de sanctions et les règles de signature non actualisées ne deviennent pas des questions réglementaires. L’édition ProG 2023 est utilisée pour la capitalisation, le suivi commercial et les pratiques de pilotage, sans transformer sa stratégie en objectifs actuels de JLE.

## Parcours et évaluation

Depuis chaque formation disposant de questions, deux accès préparent le quiz ou les flashcards avec le bon filtre. Le mode Par formation et le filtre Formation sont aussi accessibles directement dans les entraînements. Les flashcards réutilisent les mêmes corrigés.

Le test blanc conserve 30 questions, quinze par domaine. Il exclut les questions internes ou historiques issues des formations (`formationId` présent et `kiwiVerified` faux), et conserve les questions réglementaires vérifiées ainsi que la banque initiale. Les comptes et résultats existants restent compatibles ; le nouveau mode est validé et noté par le serveur.

## Vérification technique

Les tests couvrent les quatre choix distincts, l’unicité des identifiants et des énoncés, la réponse unique, le rattachement à une formation et une page existantes, le filtrage des quiz et des cartes, l’exclusion des repères internes du test blanc et l’enregistrement noté du nouveau mode. Les 500 questions initiales ont été comparées au commit précédent et n’ont pas changé.
