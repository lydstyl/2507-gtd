# GTD App - Monorepo

Une application complète de gestion de tâches (GTD - Getting Things Done) avec authentification, construite en monorepo avec React (frontend) et Node.js (backend).

## Fonctionnalités

- Authentification complète (inscription, connexion, JWT)
- Gestion des tâches avec sous-tâches illimitées
- Système de priorités : importance (0–50) × complexité (1–9) = points
- Dates planifiées et dates d'échéance
- Gestion des tags avec couleurs
- Import/Export CSV
- Chatbot IA pour gérer les tâches en langage naturel (Anthropic, OpenAI, OpenRouter)
- Progressive Web App (PWA) — installable, mode hors-ligne

## Installation

### Option A — Docker (recommandé)

Prérequis : Docker et Docker Compose installés.

```bash
git clone <repository-url>
cd gtd-app

# Copier et remplir les variables d'environnement
cp .env.example .env
# Éditer .env avec tes secrets (DB_PASSWORD, JWT_SECRET, clé LLM...)

# Builder les images et démarrer
docker compose build
docker compose up -d
```

L'application est disponible sur **http://localhost** (frontend + API).

Les migrations de base de données s'appliquent automatiquement au premier démarrage du backend.

> **Architecture réseau Docker** : le container `frontend` embarque son propre **nginx interne** qui sert les fichiers statiques ET proxy les requêtes `/api` vers le container `backend`. Le container `backend` n'a donc pas besoin d'être exposé publiquement — tout passe par le frontend sur le port 80 (ou le port mappé, ex: 3080). Si vous utilisez un nginx externe en reverse proxy, il suffit de proxy **uniquement** vers le port du container frontend ; ne pas ajouter de bloc `location /api` redondant.

### Option B — Sans Docker (développement classique)

Prérequis : Node.js 24 LTS, une instance PostgreSQL accessible.

```bash
git clone <repository-url>
cd gtd-app

npm run install:all

# Copier et remplir les variables d'environnement (un seul fichier à la racine)
cp .env.example .env
# Éditer .env : DATABASE_URL, JWT_SECRET, LLM_PROVIDER, clé API...

cd backend
npm run db:migrate   # Appliquer les migrations
cd ..

npm run dev          # Backend :3000 + Frontend :5173
```

## Développement avec Docker

Les deux approches partagent la même image Docker mais utilisent des bases de données **complètement séparées** — elles ne se mélangent jamais.

### Utiliser uniquement la base de données via Docker

La façon la plus simple de développer avec PostgreSQL sans l'installer localement :

```bash
# Démarrer seulement postgres (le port 5432 est exposé grâce au docker-compose.override.yml)
docker compose up postgres -d

# Appliquer les migrations puis lancer le dev
cd backend && npm run db:migrate && cd ..
npm run dev   # Développement normal avec hot-reload
```

Si les containers backend et frontend Docker tournent déjà (après un `docker compose up -d`), stoppe-les avant de lancer `npm run dev` — sinon le port 3000 est déjà occupé :

```bash
docker compose stop backend frontend
npm run dev
```

Quand tu as fini de travailler :

```bash
docker compose down   # Arrête postgres (les données sont conservées)
```

### Dev vs Prod — quelle base de données ?

| | Développement | Production |
|---|---|---|
| **Base de données** | Postgres Docker local (port 5432 exposé) | Postgres Docker interne (pas exposé) |
| **Backend** | `npm run dev` (nodemon, hot-reload) | Container Docker |
| **Frontend** | `npm run dev` (Vite HMR, :5173) | Container Docker (nginx, :80) |
| **Migrations** | `npm run db:migrate` manuellement | Automatique au démarrage du container |
| **Variables** | `.env` à la racine | `.env` à la racine (chargé par docker compose) |

> Les données de dev et de prod ne se partagent jamais — volumes Docker distincts, mots de passe distincts.

## Scripts disponibles

### Racine (monorepo)

| Commande | Description |
|---|---|
| `npm run dev` | Backend + Frontend en simultané |
| `npm run build` | Build shared → backend → frontend |
| `npm run test` | Tous les tests (shared + backend + frontend) |
| `npm run prod:update` | Pull, build et redémarrage PM2 en production |

### Backend (`cd backend`)

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (nodemon) |
| `npm run test` | Tous les tests Vitest |
| `npm run test:domain` | Tests domaine uniquement |
| `npm run test:usecases` | Tests use cases uniquement |
| `npm run test:integration` | Tests d'intégration (e2e) |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:studio` | Ouvrir Prisma Studio |

### Frontend (`cd frontend`)

| Commande | Description |
|---|---|
| `npm run dev` | Serveur Vite (:5173) |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run test` | Tests Vitest |

### Docker

| Commande | Description |
|---|---|
| `docker compose build` | Builder les images backend et frontend |
| `docker compose up -d` | Démarrer tout (postgres + backend + frontend) |
| `docker compose up postgres -d` | Démarrer seulement postgres (dev) |
| `docker compose down` | Arrêter les containers |
| `docker compose down -v` | Arrêter et supprimer les volumes (reset DB) |
| `docker compose logs -f backend` | Suivre les logs backend |

## Variables d'environnement

Un seul fichier `.env` à la racine — copier [`.env.example`](.env.example) :

```env
# Base de données (Docker)
DB_PASSWORD=mot_de_passe_securise

# Base de données (développement local — même mot de passe)
DATABASE_URL=postgresql://gtd_user:mot_de_passe_securise@localhost:5432/gtd_production

# Application
JWT_SECRET=chaine_aleatoire_longue_32_chars_min
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173       # production : https://ton-domaine.com

# Chatbot LLM
LLM_PROVIDER=openrouter                  # anthropic | openai | openrouter
OPENROUTER_API_KEY=sk-or-...
```

Le backend charge ce fichier automatiquement (dev et Docker). En production Docker, `CORS_ORIGINS` doit pointer vers ton domaine.

## Architecture

Monorepo npm workspaces avec 3 packages :

- `shared/` — logique métier partagée (`@gtd/shared`) : entités, services, validation, constantes
- `backend/` — API Node.js + Express + Prisma (Clean Architecture)
- `frontend/` — React + Vite + Tailwind CSS (Clean Architecture)

Toute la logique métier vit dans `shared/` pour éviter la duplication.

## Technologies

**Backend** : Node.js 24, Express, TypeScript, Prisma, PostgreSQL, bcrypt, JWT, Vercel AI SDK

**Frontend** : React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, TipTap

## API Endpoints

### Authentification

- `POST /api/auth/register` — Inscription
- `POST /api/auth/login` — Connexion

### Tâches (token requis)

- `GET /api/tasks` — Toutes les tâches
- `POST /api/tasks` — Créer
- `PUT /api/tasks/:id` — Modifier
- `DELETE /api/tasks/:id` — Supprimer
- `POST /api/tasks/:id/complete` — Marquer complétée
- `GET /api/tasks/export` — Export CSV
- `POST /api/tasks/import` — Import CSV

### Tags (token requis)

- `GET /api/tags` — Tous les tags
- `POST /api/tags` — Créer
- `PUT /api/tags/:id` — Modifier
- `DELETE /api/tags/:id` — Supprimer

### Chatbot (token requis)

- `POST /api/chat` — Envoyer un message (streaming SSE)

## Dépannage

| Problème | Solution |
|---|---|
| Port 3000 ou 5173 occupé | `lsof -ti:3000 \| xargs kill` |
| Backend ne démarre pas | Vérifier `backend/.env` et la connexion PostgreSQL |
| Chat ne fonctionne pas | Vérifier la clé API LLM dans `.env` |
| Build Docker échoue | `docker compose build --no-cache` |
| Erreur de migration | `docker compose exec backend node_modules/.bin/prisma migrate status` |

## Changer le mot de passe de la base de données

PostgreSQL stocke le mot de passe lors de la **première initialisation du volume**. Changer `DB_PASSWORD` dans `.env` seul ne suffit pas — il faut aussi le changer à l'intérieur de PostgreSQL.

### Option A — Conserver les données

```bash
# Se connecter au container postgres
docker compose exec postgres psql -U gtd_user -d gtd_production

# Changer le mot de passe dans PostgreSQL
ALTER USER gtd_user WITH PASSWORD 'nouveau_mot_de_passe';
\q

# Mettre à jour .env
# DB_PASSWORD=nouveau_mot_de_passe
# DATABASE_URL=postgresql://gtd_user:nouveau_mot_de_passe@localhost:5432/gtd_production

# Redémarrer
docker compose restart
```

### Option B — Repartir de zéro (données perdues)

```bash
docker compose down -v   # Supprime les containers ET le volume

# Mettre à jour .env, puis relancer
docker compose up -d
```

## Licence

MIT
