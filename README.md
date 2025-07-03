# GTD App - Monorepo

Une application complète de gestion de tâches (GTD - Getting Things Done) avec authentification, construite en monorepo avec React (frontend) et Node.js (backend).

## 🚀 Fonctionnalités

### Backend (Node.js + Express + Prisma)

- ✅ **Authentification complète** (inscription, connexion, JWT)
- ✅ Gestion des tâches avec sous-tâches illimitées
- ✅ Système de priorités (importance, urgence, priorité)
- ✅ Dates d'échéance optionnelles pour les tâches
- ✅ Gestion des tags
- ✅ API REST complète
- ✅ Base de données SQLite avec Prisma
- ✅ TypeScript pour la sécurité des types
- ✅ Sécurité : chaque utilisateur ne voit que ses propres données

### Frontend (React + Vite + Tailwind CSS)

- ✅ **Interface moderne** avec Tailwind CSS
- ✅ **Responsive design** pour mobile et desktop
- ✅ **Page d'accueil** avec présentation des fonctionnalités
- ✅ **États d'authentification** (connecté/déconnecté)
- ✅ **TypeScript** pour la sécurité des types

## 📁 Structure du projet

```
gtd-app/
├── backend/           # API Node.js + Express + Prisma
│   ├── src/
│   │   ├── domain/           # Entités et logique métier
│   │   ├── infrastructure/   # Implémentations (Prisma, etc.)
│   │   ├── interfaces/       # Interfaces et contrats
│   │   ├── presentation/     # Contrôleurs et routes
│   │   ├── services/         # Services métier
│   │   └── usecases/         # Cas d'usage
│   ├── prisma/        # Schéma et migrations de base de données
│   └── package.json
├── frontend/          # Application React + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # Composants React
│   │   ├── pages/           # Pages de l'application
│   │   ├── hooks/           # Hooks personnalisés
│   │   └── utils/           # Utilitaires
│   └── package.json
├── package.json       # Configuration monorepo
└── README.md
```

## 🛠️ Installation

1. **Cloner le projet**

```bash
git clone <repository-url>
cd gtd-app
```

2. **Installer toutes les dépendances**

```bash
npm run install:all
```

3. **Configurer la base de données**

```bash
cd backend
npm run db:generate
npm run db:push
cd ..
```

4. **Configurer les variables d'environnement** (optionnel)

```bash
# Créer un fichier backend/.env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=30d
```

5. **Démarrer l'application complète**

```bash
npm run dev
```

## 🎯 Scripts disponibles

### Monorepo (racine)

- `npm run dev` : Démarrer backend et frontend simultanément
- `npm run dev:backend` : Démarrer uniquement le backend
- `npm run dev:frontend` : Démarrer uniquement le frontend
- `npm run build` : Construire backend et frontend
- `npm run install:all` : Installer toutes les dépendances

### Backend

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Compiler le projet
- `npm start` : Démarrer le serveur en production
- `npm run db:generate` : Générer le client Prisma
- `npm run db:push` : Pousser le schéma vers la base de données
- `npm run db:migrate` : Exécuter les migrations

### Frontend

- `npm run dev` : Démarrer le serveur de développement Vite
- `npm run build` : Construire pour la production
- `npm run preview` : Prévisualiser la build de production

## 🌐 Accès à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **Documentation API** : http://localhost:3000

## 🔐 API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Tâches (Authentification requise)

- `GET /api/tasks` - Récupérer toutes les tâches
- `POST /api/tasks` - Créer une tâche
- `GET /api/tasks/:id` - Récupérer une tâche
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche

### Tags (Authentification requise)

- `GET /api/tags` - Récupérer tous les tags
- `POST /api/tags` - Créer un tag
- `GET /api/tags/:id` - Récupérer un tag
- `PUT /api/tags/:id` - Modifier un tag
- `DELETE /api/tags/:id` - Supprimer un tag

## 🎨 Technologies utilisées

### Backend

- **Node.js** avec **Express**
- **TypeScript** pour la sécurité des types
- **Prisma** pour l'ORM et la gestion de base de données
- **SQLite** pour la base de données
- **bcrypt** pour le hash des mots de passe
- **jsonwebtoken** pour l'authentification JWT

### Frontend

- **React 18** avec **TypeScript**
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **React Hooks** pour la gestion d'état

## 🔒 Sécurité

- **Authentification JWT** : Toutes les routes de données nécessitent un token valide
- **Hash des mots de passe** : Utilisation de bcrypt pour sécuriser les mots de passe
- **Isolation des données** : Chaque utilisateur ne peut accéder qu'à ses propres tâches et tags
- **Validation des entrées** : Validation côté serveur de toutes les données
- **Gestion d'erreurs** : Messages d'erreur appropriés sans exposition d'informations sensibles

## 🚀 Développement

### Structure des données

#### User (Utilisateur)

- `id` : Identifiant unique
- `email` : Email unique (obligatoire)
- `password` : Mot de passe hashé (obligatoire)
- `createdAt` : Date de création
- `updatedAt` : Date de modification

#### Task (Tâche)

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

#### Tag

- `id` : Identifiant unique
- `name` : Nom du tag (unique par utilisateur)
- `color` : Couleur optionnelle
- `userId` : ID de l'utilisateur propriétaire
- `createdAt` : Date de création
- `updatedAt` : Date de modification

## 📝 Exemples d'utilisation

### Inscription et connexion

```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Création de tâche

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "name": "Ma première tâche",
    "importance": 3,
    "urgency": 7,
    "priority": 5,
    "dueDate": "2025-08-15"
  }'
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT License
