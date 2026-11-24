# BTTF DVD Shop

Application web de calcul du prix d'un panier de DVD, avec la promotion
_Retour vers le futur_. Le cahier des charges complet est dans l'issue
[#1](https://github.com/bakate/bttf-dvd-shop/issues/1).

Le projet part du template Turborepo de l'auteur
([bakate/turborepo-template](https://github.com/bakate/turborepo-template)),
débarrassé de son code d'exemple.

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

## Scripts

| Commande                  | Rôle                                                        |
| :------------------------ | :---------------------------------------------------------- |
| `pnpm dev`                | Lance l'API et le frontend en mode watch                    |
| `pnpm build`              | Compile l'API et le frontend                                |
| `pnpm typecheck`          | Vérifie les types de tous les workspaces                    |
| `pnpm test`               | Lance les tests Vitest et ceux de `scripts/`                |
| `pnpm test:coverage`      | Lance les tests avec la couverture                          |
| `pnpm check`              | Lint et format Biome sur tout le dépôt (sans écriture)      |
| `pnpm format`             | Formate tout le dépôt avec Biome                            |
| `pnpm generate:api`       | Régénère le document OpenAPI et les types du frontend       |
| `pnpm check:api-contract` | Échoue si les artefacts du contrat d'API ne sont pas à jour |
| `pnpm clean`              | Supprime les artefacts de build et les caches               |

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

## Pour contribuer

- [`CODING_STANDARDS.md`](CODING_STANDARDS.md) : les règles d'écriture du
  code, des tests et des commits.
- [`docs/adr`](docs/adr) : les décisions d'architecture et leurs raisons.
- [`AGENTS.md`](AGENTS.md) : le point d'entrée des agents de code.
