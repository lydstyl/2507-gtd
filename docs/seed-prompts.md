# Seed Prompts — Améliorations GTD

Prompts autonomes à donner à un agent (Hermes/OpenCode) pour traiter chaque sujet.
Chaque prompt est self-contained : contexte, objectif, contraintes, vérifications.

---

## Sujet 1 : Split des notes HTML hors des réponses de liste API

> **Problème mesuré** : `GET /api/tasks` renvoie TOUTES les tâches avec leur note HTML complète.
> Payload : ~906 Ko non compressé / ~237 Ko gzippé pour la liste complète (le paramètre `limit` semble ignoré).
> Sur mobile 4G, c'est le facteur de lenteur dominant après le fix gzip.
> Les notes ne sont utiles que quand on OUVRE une tâche — pas dans la liste.

```
CONTEXTE
Repo : ~/apps/2507-gtd-docker (monorepo npm workspaces : shared, backend, frontend).
Stack : Node.js + Express + Prisma + PostgreSQL (Docker) / React + Vite.
Le backend expose les endpoints REST (port 3001 en Docker) et le MCP (3003).
Le frontend charge les tâches via api.getRootTasks() (utils/api.ts) et les affiche
dans TaskListPage → SwipeableTaskCard → TaskCard. Le tri se fait côté backend
(TaskSorting.ts, catégories Collected → Overdue → Today → Tomorrow → No-date → Future).

OBJECTIF
Ne plus envoyer les notes HTML complètes dans les réponses de LISTE, uniquement
dans le détail d'une tâche (GET /api/tasks/:id). Cible : liste ~100 Ko (sans notes).

ÉTAPES SUGGÉRÉES
1. Backend : dans le repository (PrismaTaskRepository) ou le DTO (TaskDto), faire
   un `select` Prisma qui exclut `note` pour les requêtes de liste, et l'inclut
   pour getById. Vérifier TOUS les callers de la liste (taskController, MCP,
   export CSV — le CSV a BESOIN des notes, ne pas casser).
2. API : vérifier pourquoi `limit` est ignoré sur GET /api/tasks et le corriger
   au passage (pagination propre) OU assumer "tout sans notes".
3. Frontend : TaskCard ne doit PAS afficher un aperçu de note si elle n'est plus
   chargée. Si l'éditeur de note (ouverture tâche) a besoin de la note, la charger
   via GET /api/tasks/:id à l'ouverture (lazy). Chercher les usages de `task.note`
   dans TaskCard, EditTaskModal, CreateTaskModal, QuickAddInput.
4. Recherche : vérifier si la recherche frontend ou le détecteur de doublons
   (useDuplicateWordDetection) utilisent les notes — si oui, décider : recherche
   côté backend sur notes, ou acceptation de ne pas chercher dans les notes.

CONTRAINTES
- Ne PAS casser : export/import CSV (16 colonnes dont Statut), MCP get-task,
  affichage des notes dans le détail, copie des notes à l'édition.
- Tous les tests doivent rester verts : `npm run test` (shared 231, backend 200,
  frontend 231). Les tests e2e qui créent des tâches avec notes et les relisent
  doivent continuer à marcher.
- Le champ `note` reste dans le modèle Task (pas de suppression).

VÉRIFICATIONS
- curl GET /api/tasks : les objets n'ont plus `note` (ou note absente)
- curl GET /api/tasks/:id : la note est présente
- Test manuel mobile : /tasks et /someday chargent nettement plus vite
- npm run test complet au vert

RAPPEL IMPORTANT
- Docker : `cd ~/apps/2507-gtd-docker && docker compose up -d --build backend frontend`
  (l'utilisateur lydstyl est dans le groupe docker, pas besoin de sudo)
- Après rebuild, vider le cache du service worker PWA mobile (1-2 rechargements)
- NE PAS commiter sans validation de l'utilisateur
```

---

## Sujet 2 : Tests backend sur une base de test dédiée (au lieu de la prod)

> **Problème** : les tests backend (Vitest) tournent contre la PostgreSQL de PRODUCTION.
> Cause : `backend/__tests__/setup.ts` charge `../.env` (racine repo), et `.env`
> contient `DATABASE_URL=postgresql://...localhost:5436/gtd_production`.
> Les tests créent des users `test-*` (isolés, pas de vraie pollution), mais c'est
> risqué : dépendance à l'état prod, lenteur, et un test qui rate son cleanup peut
> laisser des données en prod.

```
CONTEXTE
Repo : ~/apps/2507-gtd-docker. Backend : Express + Prisma + PostgreSQL.
- Prod Docker : postgres sur port 5436 (database gtd_production)
- Tests : vitest.config.js a `singleFork: true` (séquentiel, 30s timeout par test)
- backend/__tests__/setup.ts : `dotenv.config({ path: '../.env' })` → DATABASE_URL prod
- Les tests utilisent déjà des users préfixés `test-` (isolation fonctionnelle)
- Migration Prisma : backend/prisma/migrations/ (dont 20260803090000_importance_scale_no_points)

OBJECTIF
Faire tourner les tests backend sur une base PostgreSQL dédiée (ex: gtd_test)
ou SQLite, sans toucher à la prod. Le code de prod ne doit RIEN changer.

ÉTAPES SUGGÉRÉES
1. Créer une variable d'env dédiée, ex. `DATABASE_URL_TEST` dans le .env :
   postgresql://gtd_user:${DB_PASSWORD}@localhost:5436/gtd_test
2. Créer la base : `docker exec gtd-docker-postgres psql -U gtd_user -c "CREATE DATABASE gtd_test;"`
   (vérifier que le user a les droits, sinon via postgres superuser)
3. Modifier backend/__tests__/setup.ts (ou vitest.config.js env) pour utiliser
   DATABASE_URL_TEST quand elle existe, sinon fallback SQLite (backend/dev.db).
   ⚠️ Le skill GTD mentionne que dev.db/SQLite était l'ancien mode — vérifier
   ce qui est le plus fiable : SQLite peut diverger de Postgres (types, contraintes).
4. Appliquer les migrations sur la base de test AVANT les tests (globalSetup
   Vitest avec `prisma migrate deploy` ou `prisma db push`).
5. Cleanup par test : TRUNCATE ou DELETE sur les tables (tasks, task_tags, tags,
   users, api_keys) — garder l'isolation par user préfixé `test-` si plus simple.
6. Vérifier que le MCP (3003) et les outils mcp_gtd_* continuent de pointer la prod
   (eux, c'est normal qu'ils utilisent la prod).

CONTRAINTES
- La prod (gtd_production) ne doit plus JAMAIS être touchée par les tests.
- Ne pas casser le lancement des tests en local sans Postgres : fallback propre.
- Garder `singleFork: true` et le timeout 30s (tests DB).
- Tous les tests verts : backend 200 pass / 8 skip actuellement.

VÉRIFICATIONS
- `grep DATABASE_URL backend/__tests__/setup.ts` → pointe la base de test
- Pendant un run de test : `SELECT count(*) FROM tasks` sur gtd_production reste stable
- npm run test backend au vert
- Vérifier qu'aucun fichier de test ne hardcode la prod

RAPPEL IMPORTANT
- Docker : `docker exec gtd-docker-postgres psql ...` fonctionne (user gtd_user)
- NE PAS commiter le .env ni les credentials
- NE PAS commiter sans validation de l'utilisateur
```
