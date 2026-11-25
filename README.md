# BTTF DVD Shop

Application web de calcul du prix d'un panier de DVD, avec la promotion
_Retour vers le futur_. Le cahier des charges complet est dans l'issue
[#1](https://github.com/bakate/bttf-dvd-shop/issues/1).

**Démo** : <https://bttf-dvd-shop.onrender.com>. Le service gratuit de
Render s'endort après une période d'inactivité : la première requête peut
prendre **environ 30 s**, le temps que le conteneur redémarre.

Le projet part du template Turborepo de l'auteur
([bakate/turborepo-template](https://github.com/bakate/turborepo-template)),
débarrassé de son code d'exemple.

## Hypothèses métier

Le sujet ne tranche pas ces cas. Ces hypothèses ont été envoyées au
recruteur « sauf avis contraire » (#1) et sont détaillées dans les ADR
[0007](docs/adr/0007-integer-cents-single-currency.md),
[0008](docs/adr/0008-input-reading-and-saga-membership.md) et
[0009](docs/adr/0009-discount-tiers-as-data.md).

1. **Lecture du panier** : un titre par ligne. La casse est ignorée, les
   espaces en début, en fin et répétés aussi, et les lignes vides sont
   sautées. Aucun alias : « Retour vers le futur » est un film hors saga.
2. **Appartenance à la saga** : seuls `Back to the Future 1`, `2` et `3`
   sont des épisodes, à 15 €. Toute autre ligne, y compris
   `Back to the Future 4` ou `Back to the Future` sans numéro, est un film
   hors saga à 20 €, jamais remisé.
3. **Portée de la remise** : le palier dépend du nombre d'épisodes
   **différents** (2 → 10 %, 3 → 20 %), et le taux s'applique à **tous**
   les DVD de la saga, doublons compris. 1, 2, 3, 2 → (15 × 4) × 0,8 = 48 €.
4. **Montants** : des centimes d'euro entiers, une seule devise (EUR). La
   remise est arrondie au centime le plus proche.
5. **Panier vide** : un panier sans film une fois lu est refusé
   (`cart/empty`), jamais facturé 0 €.
6. **Limites** : au plus 500 lignes remplies, 200 caractères par ligne et
   16 Ko de requête, refusés avec un code stable (ADR
   [0012](docs/adr/0012-invalid-carts-as-problem-details.md)).

Le vocabulaire du domaine (panier, épisode, palier de remise…) est défini
dans [`GLOSSARY.md`](GLOSSARY.md).

## Stack

- **Monorepo** : Turborepo + workspaces pnpm
- **API** : NestJS 11, Zod, Helmet, rate limiting, documentation Scalar
- **Frontend** : React 19, Vite 8, Mantine 9
- **Qualité** : TypeScript strict, Biome, Vitest, Husky, Commitlint,
  lint-staged

## Prérequis

- Node.js **26 LTS**, seule version supportée (déclarée dans `.nvmrc`). Avec
  nvm : `nvm use`.
- pnpm 11, dont la version exacte est fixée par `packageManager`. Avec
  Corepack : `corepack enable`.

`pnpm install` échoue volontairement avec une autre version de Node
(`engineStrict`).

## Démarrage

```sh
pnpm install
pnpm dev
```

URLs locales :

| Service        | URL                                           |
| :------------- | :-------------------------------------------- |
| Frontend       | `http://localhost:5173`                       |
| API            | `http://localhost:3000/api`                   |
| Health check   | `http://localhost:3000/api/health`            |
| Documentation  | `http://localhost:3000/api/docs`              |
| OpenAPI (JSON) | `http://localhost:3000/api/docs/openapi.json` |

Le serveur Vite redirige `/api` vers `http://localhost:3000`, le frontend
appelle donc l'API par des URLs relatives.

## Avec Docker

Sans Node installé, avec Docker uniquement :

```sh
docker compose up --build
```

L'application (frontend et API) répond sur `http://localhost:3000`, l'API
sur `http://localhost:3000/api`. Le conteneur tourne en utilisateur non
root, Docker vérifie sa santé sur `/api/health` et Compose le redémarre
s'il s'arrête.

Le test de bout en bout (Playwright) vise ce conteneur :

```sh
pnpm --filter web exec playwright install chromium
docker compose up --build --wait
pnpm test:e2e
```

## Scripts

| Commande                    | Rôle                                                        |
| :-------------------------- | :---------------------------------------------------------- |
| `pnpm dev`                  | Lance l'API et le frontend en mode watch                    |
| `pnpm build`                | Compile l'API et le frontend                                |
| `pnpm typecheck`            | Vérifie les types de tous les workspaces                    |
| `pnpm test`                 | Lance les tests Vitest et ceux de `scripts/`                |
| `pnpm test:coverage`        | Lance les tests avec la couverture                          |
| `pnpm test:e2e`             | Lance le test Playwright contre le conteneur démarré        |
| `pnpm check`                | Lint et format Biome sur tout le dépôt (sans écriture)      |
| `pnpm check:ui-conventions` | Échoue sur un texte ou une valeur de style écrits en dur    |
| `pnpm format`               | Formate tout le dépôt avec Biome                            |
| `pnpm generate:api`         | Régénère le document OpenAPI et les types du frontend       |
| `pnpm check:api-contract`   | Échoue si les artefacts du contrat d'API ne sont pas à jour |
| `pnpm clean`                | Supprime les artefacts de build et les caches               |

## Structure

```txt
apps/
  api/                NestJS : modules métier, documentation, configuration
  web/                React + Vite + Mantine
tooling/
  biome-config/       Configuration Biome partagée
  openapi-codegen/    Génération des types frontend depuis le contrat OpenAPI
  typescript/         Configurations TypeScript partagées
scripts/              Vérification des conventions UI
docs/
  adr/                Décisions d'architecture
  agents/             Configuration des agents (suivi des issues, labels, domaine)
```

## API

L'application est construite à un seul endroit, `createApp`
(`apps/api/src/app.factory.ts`), qu'utilisent le serveur, le générateur
OpenAPI et les tests HTTP. Les modules métier vivent dans
`apps/api/src/modules`.

Variables d'environnement, validées au démarrage :

| Variable                | Défaut        | Rôle                                       |
| :---------------------- | :------------ | :----------------------------------------- |
| `NODE_ENV`              | `development` | `development`, `test` ou `production`      |
| `PORT`                  | `3000`        | Port HTTP de l'API                         |
| `CORS_ORIGIN`           | absent        | Origine autorisée en CORS                  |
| `WEB_DIST_DIR`          | absent        | Dossier du frontend compilé à servir       |
| `API_RATE_LIMIT_TTL_MS` | `60000`       | Fenêtre du rate limiting, en millisecondes |
| `API_RATE_LIMIT_LIMIT`  | `100`         | Nombre maximum de requêtes par fenêtre     |

## Design system

Le frontend repose sur un thème Mantine dédié (`apps/web/src/theme/theme.ts`) :
palettes de 10 nuances, polices auto-hébergées, tailles des titres, anneau de
focus, réduction des animations, mode clair uniquement.

La règle : **un token manquant s'ajoute au thème, il ne s'écrit jamais en
dur.** Aucun nombre magique (`14.5px`, `200px`, `150ms`, couleur) ni `style` inline
hors du thème, aucun CSS hors de `apps/web/src/global.css`, et tous les textes
dans `apps/web/src/messages.ts`. `pnpm check:ui-conventions` le vérifie en CI et
à chaque commit.

Chaque contrôle s'utilise au clavier et montre un anneau de focus visible,
et les contrastes respectent le niveau WCAG AA.

## Localisation

L'interface est en français uniquement, sans bibliothèque i18n (ADR
[0005](docs/adr/0005-no-i18n-library.md)) :

- tous les textes, y compris le titre du document et sa description, sont
  dans l'objet typé `apps/web/src/messages.ts`. Un texte paramétré est une
  fonction ;
- les prix et les taux passent par les formateurs `Intl` de
  `apps/web/src/format.ts` (`fr-FR`, EUR) ;
- l'API ne renvoie jamais de texte français : le frontend traduit ses codes
  d'erreur (`cart/empty`…) via le module de messages, avec un message
  générique pour un code inconnu ;
- les tests d'écran importent leurs textes attendus de ce module, sans les
  recopier.

## Contrat d'API

L'API possède le contrat HTTP. `pnpm generate:api` produit :

- `apps/api/openapi/openapi.json`, généré depuis l'application NestJS ;
- `apps/web/src/generated/api`, les types TypeScript du frontend.

Ces fichiers sont versionnés et ne s'éditent jamais à la main. La CI échoue
s'ils ne correspondent plus au code (`pnpm check:api-contract`).

## Qualité et CI

Chaque pull request passe par le job **Quality gate**
(`.github/workflows/ci.yml`), obligatoire pour merger sur `main`. En local,
le hook `pre-commit` lance Biome sur les fichiers indexés et le hook
`commit-msg` vérifie le message de commit.

## Ce qui a été gardé du template

| Fonctionnalité          | Pourquoi elle reste                                                                         |
| :---------------------- | :------------------------------------------------------------------------------------------ |
| Helmet                  | Envoie une CSP stricte et les en-têtes de sécurité HTTP sans code à maintenir.              |
| Rate limiting           | Une API publique sans authentification doit tenir face à une rafale de requêtes.            |
| Documentation d'API     | Scalar et le document OpenAPI permettent d'intégrer l'API sans lire le code.                |
| Validation de la config | Un schéma Zod fait échouer le démarrage sur une variable invalide, pas la première requête. |
| Vérification du contrat | `check:api-contract` empêche le frontend et l'API de diverger sans que la CI le voie.       |

Le reste du template (l'exemple « todos », XState, le déploiement Vercel)
a été retiré (ADR [0001](docs/adr/0001-template-and-stack.md)).

## Sécurité

[`SECURITY.md`](SECURITY.md) fait correspondre chaque risque de l'OWASP
Top 10 (2025) à la mesure du projet, et indique les catégories sans objet
(pas d'authentification, pas de base de données).

## Évolutions possibles

- **Plusieurs devises** : remplacer `EuroCents` par un type `Money` qui
  porte sa devise (ADR [0007](docs/adr/0007-integer-cents-single-currency.md)).
- **Alias de titres** (« Retour vers le futur », « BTTF II ») : un
  changement du catalogue, pas du calcul (ADR
  [0008](docs/adr/0008-input-reading-and-saga-membership.md)).
- **Tests basés sur les propriétés** (fast-check) : vérifier des invariants
  du calcul (le total ne dépasse jamais la somme des prix unitaires) sur
  des paniers générés.
- **Bibliothèque i18n** : le jour d'une deuxième langue, avec le chemin de
  migration décrit dans l'ADR [0005](docs/adr/0005-no-i18n-library.md).
- **Service de monitoring** (Sentry…) : à brancher dans `reportError`
  (`apps/web/src/report-error.ts`), seule sortie des erreurs du frontend.
- **Mode sombre** : remplir la section `dark` du thème et lever le schéma
  forcé (ADR [0004](docs/adr/0004-light-mode-only.md)).

## Pour contribuer

- [`CODING_STANDARDS.md`](CODING_STANDARDS.md) : les règles d'écriture du
  code, des tests et des commits.
- [`docs/adr`](docs/adr) : les décisions d'architecture et leurs raisons.
- [`GLOSSARY.md`](GLOSSARY.md) : le vocabulaire du domaine, en anglais et
  en français.
- [`SECURITY.md`](SECURITY.md) : les mesures de sécurité, risque par risque.
- [`AGENTS.md`](AGENTS.md) : le point d'entrée des agents de code.
