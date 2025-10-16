# Configuration des Ports - Application GTD

Ce document explique la configuration des ports pour les différents environnements de l'application GTD.

## 🏗️ Architecture des Ports

### **Mode Développement**

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (Vite)        │    │   (Express)     │
│   Port: 5173    │◄──►│   Port: 3000    │
└─────────────────┘    └─────────────────┘
```

### **Mode Production/Test (Port Personnalisable)**

```
┌─────────────────────────────────┐
│      Serveur Unifié             │
│   (Express + Frontend Buildé)   │
│         Port: [CUSTOM]          │
└─────────────────────────────────┘
```

## 🔧 Configuration des Environnements

### **Développement**

#### Backend (`.env`)

```bash
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production"
CORS_ORIGIN="http://localhost:5173,http://localhost:3001"
NODE_ENV="development"
```

#### Frontend (`.env`)

```bash
VITE_FRONTEND_PORT=5173
VITE_API_PORT=3000
VITE_API_BASE_URL=http://localhost:3000
```

### **Production/Test (Port Personnalisable)**

#### Backend (`.env` - généré automatiquement)

```bash
PORT=[CUSTOM_PORT]
DATABASE_URL="file:./test.db"
JWT_SECRET="test-secret-key"
NODE_ENV=production
```

#### Frontend (Variables d'environnement automatiques)

```bash
VITE_API_PORT=[CUSTOM_PORT]
VITE_FRONTEND_PORT=[CUSTOM_PORT]
NODE_ENV=production
```

## 🚀 Scripts de Configuration

### **Configuration Automatique**

```bash
# Configurer l'environnement de développement
./setup-dev.sh

# Tester l'application buildée (serveur unifié sur port par défaut 3001)
./deploy.sh test-simple

# Tester l'application buildée sur un port personnalisé
./deploy.sh test-simple 8080
./deploy.sh test-simple 5555
./deploy.sh test-simple 9000

# Déployer en production sur un port personnalisé
./deploy.sh production 8080
```

### **Démarrage Manuel**

#### Mode Développement

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Mode Production (Port Personnalisable)

```bash
# Build et démarrage du serveur unifié sur port par défaut (3001)
./deploy.sh test-simple

# Build et démarrage du serveur unifié sur port personnalisé
./deploy.sh test-simple 8080
```

## 📋 URLs d'Accès

### **Développement**

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000/api
- **Health Check** : http://localhost:3000/health

### **Production/Test (Port Personnalisable)**

- **Application Unifiée** : http://localhost:[CUSTOM_PORT]
- **API** : http://localhost:[CUSTOM_PORT]/api
- **Health Check** : http://localhost:[CUSTOM_PORT]/health

#### Exemples de Ports

| Port | URL Application       | URL API                   | URL Health                   |
| ---- | --------------------- | ------------------------- | ---------------------------- |
| 3001 | http://localhost:3001 | http://localhost:3001/api | http://localhost:3001/health |
| 8080 | http://localhost:8080 | http://localhost:8080/api | http://localhost:8080/health |
| 5555 | http://localhost:5555 | http://localhost:5555/api | http://localhost:5555/health |
| 9000 | http://localhost:9000 | http://localhost:9000/api | http://localhost:9000/health |

## 🔄 Workflow Recommandé

### **1. Configuration Initiale**

```bash
# Configurer l'environnement de développement
./setup-dev.sh
```

### **2. Développement**

```bash
# Démarrer les serveurs de développement
npm run dev
```

### **3. Test de la Build (Port Personnalisable)**

```bash
# Tester l'application buildée sur port par défaut
./deploy.sh test-simple
./test-built-app.sh

# Tester l'application buildée sur port personnalisé
./deploy.sh test-simple 8080
./test-built-app.sh 8080
```

### **4. Déploiement (Port Personnalisable)**

```bash
# Build pour production sur port par défaut
./deploy.sh production

# Build pour production sur port personnalisé
./deploy.sh production 8080
```

## ⚙️ Variables d'Environnement

### **Backend**

| Variable       | Développement    | Production        | Description               |
| -------------- | ---------------- | ----------------- | ------------------------- |
| `PORT`         | 3000             | [CUSTOM_PORT]     | Port du serveur           |
| `DATABASE_URL` | `file:./dev.db`  | `file:./test.db`  | URL de la base de données |
| `JWT_SECRET`   | `dev-secret-key` | `test-secret-key` | Clé secrète JWT           |
| `NODE_ENV`     | `development`    | `production`      | Environnement             |

### **Frontend**

| Variable             | Développement           | Production    | Description                      |
| -------------------- | ----------------------- | ------------- | -------------------------------- |
| `VITE_FRONTEND_PORT` | 5173                    | [CUSTOM_PORT] | Port du serveur de développement |
| `VITE_API_PORT`      | 3000                    | [CUSTOM_PORT] | Port de l'API backend            |
| `VITE_API_BASE_URL`  | `http://localhost:3000` | -             | URL de base de l'API             |

## 🧪 Tests et Validation

### **Tests Automatiques**

```bash
# Test sur port par défaut (3001)
./test-built-app.sh

# Test sur port personnalisé
./test-built-app.sh 8080
./test-built-app.sh 5555
./test-built-app.sh 9000
```

### **Tests Manuels**

```bash
# Vérifier que le serveur fonctionne
curl http://localhost:[CUSTOM_PORT]/health

# Vérifier l'API
curl http://localhost:[CUSTOM_PORT]/api/tasks

# Vérifier le frontend
curl http://localhost:[CUSTOM_PORT]/
```

## 🛠️ Dépannage

### **Problèmes Courants**

1. **Port déjà utilisé**

   ```bash
   # Vérifier les ports utilisés
   lsof -i :3000
   lsof -i :3001
   lsof -i :5173
   lsof -i :8080  # ou autre port personnalisé

   # Tuer les processus si nécessaire
   kill -9 <PID>
   ```

2. **Configuration incorrecte**

   ```bash
   # Reconfigurer l'environnement
   ./setup-dev.sh
   ```

3. **Build échoué**

   ```bash
   # Nettoyer et rebuilder
   rm -rf backend/dist frontend/dist
   ./deploy.sh test-simple [PORT]
   ```

4. **Frontend utilise encore l'ancien port**
   ```bash
   # Le frontend buildé utilise maintenant des URLs relatives en production
   # Pas besoin de reconfigurer, il détecte automatiquement l'environnement
   ```

### **Vérification de la Configuration**

```bash
# Vérifier que le serveur fonctionne sur le bon port
curl -I http://localhost:[CUSTOM_PORT]/health

# Vérifier que le frontend est accessible
curl -I http://localhost:[CUSTOM_PORT]/

# Vérifier que l'API répond
curl -I http://localhost:[CUSTOM_PORT]/api
```

## 📝 Notes Importantes

### **Changements Récents**

1. **Ports Personnalisables** : Vous pouvez maintenant choisir n'importe quel port pour le serveur unifié
2. **Frontend Adaptatif** : Le frontend détecte automatiquement l'environnement et utilise des URLs relatives en production
3. **Tests Flexibles** : Les scripts de test acceptent un paramètre de port

### **Bonnes Pratiques**

1. **Éviter les Ports Réservés** : Ne pas utiliser les ports 80, 443, 22, 21, etc.
2. **Ports Recommandés** : 3000-3999, 8000-8999, 9000-9999
3. **Documentation** : Toujours documenter le port utilisé en production
4. **Tests** : Tester sur le même port que celui utilisé en production

### **Exemples d'Usage**

```bash
# Développement
npm run dev

# Test sur port 8080
./deploy.sh test-simple 8080
./test-built-app.sh 8080

# Production sur port 5555
./deploy.sh production 5555

# Test rapide sur port 9000
./deploy.sh test-simple 9000
```
