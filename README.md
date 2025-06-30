# Todo List API

Une API REST complète pour gérer une todo list avec des tâches hiérarchiques et des tags.

## Fonctionnalités

- ✅ Gestion des tâches avec sous-tâches illimitées
- ✅ Système de priorités (importance, urgence, priorité)
- ✅ Gestion des tags
- ✅ Liens optionnels pour les tâches
- ✅ API REST complète
- ✅ Base de données SQLite avec Prisma
- ✅ TypeScript pour la sécurité des types

## Installation

1. Cloner le projet
2. Installer les dépendances :

```bash
npm install
```

3. Configurer la base de données :

```bash
npm run db:generate
npm run db:push
```

4. Démarrer le serveur de développement :

```bash
npm run dev
```

## Structure des données

### Task (Tâche)

- `id` : Identifiant unique
- `name` : Nom de la tâche (obligatoire)
- `link` : Lien optionnel
- `importance` : Importance de 1 à 9 (1 = plus important, défaut: 5)
- `urgency` : Urgence de 1 à 9 (défaut: 5)
- `priority` : Priorité de 1 à 9 (défaut: 5)
- `parentId` : ID de la tâche parente (optionnel)
- `createdAt` : Date de création
- `updatedAt` : Date de modification
- `subtasks` : Liste des sous-tâches
- `tags` : Liste des tags associés

### Tag

- `id` : Identifiant unique
- `name` : Nom du tag (unique)
- `color` : Couleur optionnelle
- `createdAt` : Date de création
- `updatedAt` : Date de modification

## API Endpoints

### Tâches

#### GET /api/tasks

Récupérer toutes les tâches avec filtres optionnels.

**Paramètres de requête :**

- `parentId` : Filtrer par tâche parente
- `importance` : Filtrer par niveau d'importance
- `urgency` : Filtrer par niveau d'urgence
- `priority` : Filtrer par niveau de priorité
- `search` : Rechercher dans le nom des tâches
- `tagIds` : Filtrer par tags (peut être multiple)

**Exemple :**

```bash
GET /api/tasks?parentId=null&importance=1&search=urgent
```

#### POST /api/tasks

Créer une nouvelle tâche.

**Corps de la requête :**

```json
{
  "name": "Ma tâche",
  "link": "https://example.com",
  "importance": 3,
  "urgency": 7,
  "priority": 5,
  "parentId": "task-id-optionnel",
  "tagIds": ["tag1-id", "tag2-id"]
}
```

#### GET /api/tasks/:id

Récupérer une tâche spécifique avec ses sous-tâches.

#### PUT /api/tasks/:id

Modifier une tâche existante.

#### DELETE /api/tasks/:id

Supprimer une tâche et toutes ses sous-tâches.

### Tags

#### GET /api/tags

Récupérer tous les tags.

#### POST /api/tags

Créer un nouveau tag.

**Corps de la requête :**

```json
{
  "name": "Mon tag",
  "color": "#FF5733"
}
```

#### GET /api/tags/:id

Récupérer un tag spécifique.

#### PUT /api/tags/:id

Modifier un tag existant.

#### DELETE /api/tags/:id

Supprimer un tag.

#### GET /api/tags/task/:taskId

Récupérer tous les tags d'une tâche spécifique.

## Exemples d'utilisation

### Créer une tâche principale

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Projet important",
    "importance": 1,
    "urgency": 8,
    "priority": 2
  }'
```

### Créer une sous-tâche

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Étape 1 du projet",
    "parentId": "task-id-parent",
    "importance": 2,
    "urgency": 6
  }'
```

### Créer un tag

```bash
curl -X POST http://localhost:3000/api/tags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Urgent",
    "color": "#FF0000"
  }'
```

### Associer des tags à une tâche

```bash
curl -X PUT http://localhost:3000/api/tasks/task-id \
  -H "Content-Type: application/json" \
  -d '{
    "tagIds": ["tag1-id", "tag2-id"]
  }'
```

## Scripts disponibles

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Compiler le projet TypeScript
- `npm run start` : Démarrer le serveur de production
- `npm run db:generate` : Générer le client Prisma
- `npm run db:push` : Pousser le schéma vers la base de données
- `npm run db:migrate` : Créer et appliquer une migration
- `npm run db:studio` : Ouvrir Prisma Studio

## Base de données

L'API utilise SQLite avec Prisma comme ORM. La base de données est stockée dans `prisma/dev.db`.

Pour visualiser et modifier les données directement :

```bash
npm run db:studio
```

## Gestion des erreurs

L'API retourne des codes de statut HTTP appropriés :

- `200` : Succès
- `201` : Ressource créée
- `204` : Succès sans contenu
- `400` : Requête invalide
- `404` : Ressource non trouvée
- `500` : Erreur serveur

Les erreurs sont retournées au format JSON :

```json
{
  "error": "Message d'erreur descriptif"
}
```
