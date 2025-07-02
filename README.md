# Todo List API

Une API REST complète pour gérer une todo list avec authentification, des tâches hiérarchiques et des tags.

## Fonctionnalités

- ✅ **Authentification complète** (inscription, connexion, JWT)
- ✅ Gestion des tâches avec sous-tâches illimitées
- ✅ Système de priorités (importance, urgence, priorité)
- ✅ Dates d'échéance optionnelles pour les tâches
- ✅ Gestion des tags
- ✅ Liens optionnels pour les tâches
- ✅ API REST complète
- ✅ Base de données SQLite avec Prisma
- ✅ TypeScript pour la sécurité des types
- ✅ Sécurité : chaque utilisateur ne voit que ses propres données

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

4. Configurer les variables d'environnement (optionnel) :

```bash
# Créer un fichier .env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=30d
```

5. Démarrer le serveur de développement :

```bash
npm run dev
```

## Structure des données

### User (Utilisateur)

- `id` : Identifiant unique
- `email` : Email unique (obligatoire)
- `password` : Mot de passe hashé (obligatoire)
- `createdAt` : Date de création
- `updatedAt` : Date de modification

### Task (Tâche)

- `id` : Identifiant unique
- `name` : Nom de la tâche (obligatoire)
- `link` : Lien optionnel
- `importance` : Importance de 1 à 9 (1 = plus important, défaut: 5)
- `urgency` : Urgence de 1 à 9 (défaut: 5)
- `priority` : Priorité de 1 à 9 (défaut: 5)
- `dueDate` : Date d'échéance optionnelle
- `parentId` : ID de la tâche parente (optionnel)
- `userId` : ID de l'utilisateur propriétaire
- `createdAt` : Date de création
- `updatedAt` : Date de modification
- `subtasks` : Liste des sous-tâches
- `tags` : Liste des tags associés

### Tag

- `id` : Identifiant unique
- `name` : Nom du tag (unique par utilisateur)
- `color` : Couleur optionnelle
- `userId` : ID de l'utilisateur propriétaire
- `createdAt` : Date de création
- `updatedAt` : Date de modification

## API Endpoints

### Authentification

#### POST /api/auth/register

Inscrire un nouvel utilisateur.

**Corps de la requête :**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse :**

```json
{
  "id": "user-id",
  "email": "user@example.com"
}
```

#### POST /api/auth/login

Se connecter et obtenir un token JWT.

**Corps de la requête :**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse :**

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

### Tâches (Authentification requise)

#### GET /api/tasks

Récupérer toutes les tâches de l'utilisateur connecté avec filtres optionnels.

**En-têtes requis :**

```
Authorization: Bearer <jwt-token>
```

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

Créer une nouvelle tâche pour l'utilisateur connecté.

**En-têtes requis :**

```
Authorization: Bearer <jwt-token>
```

**Corps de la requête :**

```json
{
  "name": "Ma tâche",
  "link": "https://example.com",
  "importance": 3,
  "urgency": 7,
  "priority": 5,
  "dueDate": "2025-08-15",
  "parentId": "task-id-optionnel",
  "tagIds": ["tag1-id", "tag2-id"]
}
```

#### GET /api/tasks/:id

Récupérer une tâche spécifique (seulement si elle appartient à l'utilisateur connecté).

#### PUT /api/tasks/:id

Modifier une tâche existante (seulement si elle appartient à l'utilisateur connecté).

#### DELETE /api/tasks/:id

Supprimer une tâche et toutes ses sous-tâches (seulement si elle appartient à l'utilisateur connecté).

### Tags (Authentification requise)

#### GET /api/tags

Récupérer tous les tags de l'utilisateur connecté.

**En-têtes requis :**

```
Authorization: Bearer <jwt-token>
```

#### POST /api/tags

Créer un nouveau tag pour l'utilisateur connecté.

**En-têtes requis :**

```
Authorization: Bearer <jwt-token>
```

**Corps de la requête :**

```json
{
  "name": "Mon tag",
  "color": "#FF5733"
}
```

#### GET /api/tags/:id

Récupérer un tag spécifique (seulement s'il appartient à l'utilisateur connecté).

#### PUT /api/tags/:id

Modifier un tag existant (seulement s'il appartient à l'utilisateur connecté).

#### DELETE /api/tags/:id

Supprimer un tag (seulement s'il appartient à l'utilisateur connecté).

## Exemples d'utilisation

### 1. Inscription d'un utilisateur

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Connexion et obtention du token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Créer une tâche principale

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "name": "Projet important",
    "importance": 1,
    "urgency": 8,
    "priority": 2,
    "dueDate": "2025-08-15"
  }'
```

### 4. Créer une sous-tâche

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "name": "Étape 1 du projet",
    "parentId": "task-id-parent",
    "importance": 2,
    "urgency": 6
  }'
```

### 5. Créer un tag

```bash
curl -X POST http://localhost:3000/api/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "name": "Urgent",
    "color": "#FF0000"
  }'
```

### 6. Récupérer toutes les tâches

```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <jwt-token>"
```

### 7. Associer des tags à une tâche

```bash
curl -X PUT http://localhost:3000/api/tasks/task-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "tagIds": ["tag1-id", "tag2-id"]
  }'
```

## Scripts disponibles

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Compiler le projet
- `npm start` : Démarrer le serveur en production
- `npm run db:generate` : Générer le client Prisma
- `npm run db:push` : Pousser le schéma vers la base de données
- `npm run db:migrate` : Exécuter les migrations

## Sécurité

- **Authentification JWT** : Toutes les routes de données nécessitent un token valide
- **Hash des mots de passe** : Utilisation de bcrypt pour sécuriser les mots de passe
- **Isolation des données** : Chaque utilisateur ne peut accéder qu'à ses propres tâches et tags
- **Validation des entrées** : Validation côté serveur de toutes les données
- **Gestion d'erreurs** : Messages d'erreur appropriés sans exposition d'informations sensibles

## Structure du projet

```
src/
├── domain/           # Entités et logique métier
├── infrastructure/   # Implémentations (Prisma, etc.)
├── interfaces/       # Interfaces et contrats
├── presentation/     # Contrôleurs et routes
├── services/         # Services métier
├── usecases/         # Cas d'usage
└── types/           # Types TypeScript
```

## Technologies utilisées

- **Node.js** avec **Express**
- **TypeScript** pour la sécurité des types
- **Prisma** pour l'ORM et la gestion de base de données
- **SQLite** pour la base de données
- **bcrypt** pour le hash des mots de passe
- **jsonwebtoken** pour l'authentification JWT
