# Seed — Feature « Focus top 5 » dans la liste des tâches GTD

> Instance cible : agent de code capable de modifier une app React/TypeScript.
> But : ajouter un **filtre Focus** dans `https://gtd3.duckdns.org/tasks` qui n'affiche que
> les **5 premières tâches** de la liste, **hors status `collecte` et `brouillon`**.

---

## 1. Contexte (tu n'as AUCUN autre contexte que ce fichier)

- **Repo** : `/home/lydstyl/apps/2507-gtd-docker` (monorepo npm workspaces : `shared`, `backend`, `frontend`, plus `mcp-server` hors workspaces).
- **App en prod** : conteneurs Docker déjà lancés — `gtd-docker-frontend` (port hôte **3080**), `gtd-docker-backend` (**3001**), `gtd-docker-postgres` (**5436**), `gtd-docker-mcp` (**3003**).
- **Domaine** : `https://gtd3.duckdns.org` → nginx → `127.0.0.1:3080`. La prod se teste **via le domaine**, jamais seulement en localhost.
- **Déploiement** : `./docker-up.sh --build` (injecte le token depuis `~/.hermes/secrets/gtd-api-token`, puis `docker compose up -d --build`). `./docker-up.sh` seul = `up -d` sans rebuild. `./docker-up.sh down` = arrêt.
- **Build** : `npm run build` à la racine fait `build:shared && build:backend && build:frontend` — **l'ordre compte**.
- **Tests** : `npm run test` à la racine (shared → backend → frontend). Frontend : `npm run test:domain`, `npm run test:components`, `npm run lint`.
- **Où vit le tri** : `shared/src/domain/services/TaskPriorityService.ts` (méthode `compareTasksPriority`) et `shared/src/domain/services/TaskSortingService.ts` (`sortTasksByPriority`). Le tri est appliqué dans `frontend/src/usecases/tasks/GetTasksUseCase.ts` (appel `TaskSortingService.sortTasksByPriority(taskEntities)`).
- **Où vit le filtrage** : `frontend/src/hooks/useTaskFilters.ts` (état + `applyFilters` + `clearAllFilters` + `hasActiveFilters`) et `frontend/src/components/TaskFilters.tsx` (UI). Page : `frontend/src/components/TaskListPage.tsx`.

## 2. Objectif exact

Un **filtre** (pas un mode global, pas une nouvelle page) dans `/tasks` :

1. Quand il est **actif**, la liste n'affiche que les **5 premières tâches** de l'ordre officiel de l'app.
2. Les tâches de status **`brouillon`** et **`collecte`** sont **exclues**, quoi qu'il arrive (même si leurs cases sont cochées dans les filtres de statut).
3. Un **bouton visible et désactivable** permet d'activer/désactiver le filtre, avec un état visuel clair quand il est actif, et le compteur d'items affiché doit refléter le filtre.
4. Le filtre doit être **compatible avec les filtres existants** (recherche texte, importance, complexité, tag, dates) : il s'applique **après** eux.

## 3. Règle de tri à respecter (NE PAS la réinventer)

`TaskPriorityService.compareTasksPriority(a, b, dateContext)` — ordre officiel, déjà implémenté :

- **Priorité de catégorie** : `brouillon` 1 · `pour-ia` 2 · `collected` 3 · `pret-overdue` 4 · `pret-today` 5 · `pret-tomorrow` 6 · `pret-no-date` 7 · `pret-future` 8 · `un-jour` 9.
- Une tâche de status `pret` est rangée par **date effective** (`dueDate` sinon `plannedDate`) : avant aujourd'hui → `pret-overdue` ; aujourd'hui → `pret-today` ; demain → `pret-tomorrow` ; ≥ après-demain → `pret-future` ; sans date → `pret-no-date`.
- **Dans une catégorie** : `pret-overdue` et `pret-future` par **date croissante** puis importance décroissante ; `pret-today`, `pret-tomorrow`, `pret-no-date` par **importance décroissante**. Départage final : `createdAt` décroissant, puis `id`.
- `DateContext` = `{ today, tomorrow, dayAfterTomorrow }` (`shared/src/domain/entities/TaskTypes.ts`).

**Utilise le comparateur existant** (`TaskPriorityService.compareTasksPriority`) : ne réécris aucun tri, ne touche pas à `TaskPriorityService.ts` (c'est la règle de référence).

## 4. Étapes

1. `frontend/src/hooks/useTaskFilters.ts`
   - Ajouter un booléen au `FilterState` (ex. `focusTop5: boolean`) + son `useState`, son exposition dans le retour du hook, sa remise à zéro dans `clearAllFilters`, et sa prise en compte dans `hasActiveFilters`.
   - Dans `applyFilters` : si le filtre est actif, **après** les filtres existants, (a) exclure `status === 'brouillon'` et `status === 'collecte'` et les tâches `isCompleted`, (b) trier avec `TaskPriorityService.compareTasksPriority(a, b, dateContext)` en construisant le `DateContext` (today = aujourd'hui à 00:00, tomorrow = J+1 00:00, dayAfterTomorrow = J+2 00:00), (c) garder `slice(0, 5)`.
   - ⚠️ Ne PAS neutraliser les autres filtres : ils s'appliquent d'abord, le Focus tranche ensuite.
2. `frontend/src/components/TaskFilters.tsx`
   - Ajouter le bouton/toggle (libellé suggéré : **`🎯 Focus (5)`**) avec état actif visible, en suivant le style des contrôles existants (`statusFilters`, `toggleStatusFilter`, `STATUS_OPTIONS`).
   - Quand le filtre est actif, **indiquer à l'utilisateur** que les cases `Brouillon` et `Collecte` sont ignorées (sinon il croira à un bug).
3. `frontend/src/components/TaskListPage.tsx`
   - Passer les nouvelles props au composant de filtres, et vérifier que `filteredTasksCount`, la liste rendue et l'état vide reflètent bien le filtre.
4. Tests : ajouter des cas dans `frontend/src/hooks/__tests__/useTaskFilters.test.ts` (créer le dossier/fichier s'ils n'existent pas). Couvrir au minimum : filtre inactif → liste inchangée ; filtre actif → 5 maximum ; aucun `brouillon`/`collecte` dans le résultat même si leurs cases sont cochées ; le tri obtenu respecte catégorie puis importance ; désactivation → liste complète à nouveau.

## 5. Re-validation OBLIGATOIRE (à rendre avec les sorties réelles)

```bash
cd /home/lydstyl/apps/2507-gtd-docker
npm run test                     # EXIT 0 attendu (shared + backend + frontend)
cd frontend && npm run lint && npx tsc --noEmit   # aucune erreur
cd /home/lydstyl/apps/2507-gtd-docker && ./docker-up.sh --build
```

Puis **test fonctionnel réel via le DOMAINE** (pas `localhost:3080`) :
`https://gtd3.duckdns.org/tasks` — **rafraîchissement forcé** (Ctrl+Shift+R, le bundle est mis en cache) :
1. activer le filtre → **5 tâches maximum**, aucune en `brouillon` ni `collecte` ;
2. désactiver → la liste complète revient ;
3. vérifier qu'aucune donnée n'a été modifiée (ce filtre est en **lecture seule**).

## 6. Pièges connus

- **Ordre de build** : `shared` doit être buildé avant `frontend` (sinon le front importe un `@gtd/shared` obsolète).
- **Cache navigateur** : sans rafraîchissement forcé, tu verras l'ancien bundle et croiras à un échec.
- **Base de données** : les tests backend utilisent `DATABASE_URL_TEST` (`gtd_test`) avec un garde-fou qui refuse la prod (`gtd_production`). Ne touche à **aucune** migration ni donnée de prod.
- **`useTaskFilters.dateFilter` utilise `plannedDate`** alors que le tri officiel utilise la **date effective** (`dueDate` sinon `plannedDate`) : pour le tri du Focus, passe bien par le comparateur officiel, pas par la logique du filtre de dates.
- **Volumétrie réelle** : ~271 tâches `pret`, ~117 `brouillon`, ~12 `collecte` → un Focus correct montre 5 tâches issues des `pret`.
- Si tu exclus seulement `collecte` et `brouillon`, une tâche `pour_ia` peut apparaître : c'est **conforme à la demande** (ne l'exclus pas sans le signaler).

## 7. Contraintes absolues (périmètre strict)

- **Autorisé** : `frontend/src/hooks/useTaskFilters.ts`, `frontend/src/components/TaskFilters.tsx`, `frontend/src/components/TaskListPage.tsx`, `frontend/src/hooks/__tests__/**`, plus les tests frontend existants si besoin.
- **Interdit** : `shared/src/domain/services/TaskPriorityService.ts` (règle de référence, en lecture seule), `backend/**` (aucune route, aucune migration), la base de données, `mcp-server/**`, et toute nouvelle dépendance npm.
- TypeScript strict, **pas de `any`**, pas de `@ts-ignore`.
- Aucune donnée modifiée par le filtre (lecture seule).

## 8. Orchestration

Charger d'abord le skill `pipeline-app-update` (`skill_view`) et suivre son Mode A. Description de feature à passer à `pipeline-run.sh` (⚠️ **aucun `|` ni `&`** dans cette chaîne) :

```
DESCRIPTION_FEATURE="Ajouter un filtre Focus dans la liste des taches GTD : bouton activable qui n affiche que les 5 premieres taches dans l ordre officiel de tri de TaskPriorityService, en excluant les status brouillon et collecte, avec etat visuel actif et compteur ajuste."
```
