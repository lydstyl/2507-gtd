# Guide de Test de l'Application Buildée

Ce guide explique comment build et tester l'application GTD localement avant le déploiement en production.

## 🚀 Scripts Disponibles

### 1. Script de Déploiement et Test (`deploy.sh`)

Le script `deploy.sh` a été étendu avec trois modes :

```bash
# Mode test local (build + lancement des serveurs)
./deploy.sh test-local

# Mode déploiement staging
./deploy.sh staging

# Mode déploiement production
./deploy.sh production
```

### 2. Script de Test Automatisé (`test-built-app.sh`)

Script pour tester l'application déjà en cours d'exécution :

```bash
./test-built-app.sh
```

## 🧪 Test Local Complet

### Étape 1 : Build et Lancement

```bash
# Build l'application et lance les serveurs de test
./deploy.sh test-local
```

Cette commande va :

- Installer toutes les dépendances
- Build le backend (TypeScript → JavaScript)
- Build le frontend (React → fichiers statiques)
- Démarrer le serveur backend sur le port 3001
- Démarrer le serveur frontend sur le port 3002
- Configurer la base de données de test

### Étape 2 : Test Automatisé

Dans un autre terminal :

```bash
# Tester l'application en cours d'exécution
./test-built-app.sh
```

Ce script va :

- Vérifier que les serveurs sont accessibles
- Tester tous les endpoints de l'API
- Vérifier le frontend
- Mesurer les temps de réponse
- Afficher un rapport complet

### Étape 3 : Test Manuel

Ouvrez votre navigateur et testez :

- **Frontend** : http://localhost:3002
- **API Backend** : http://localhost:3001
- **Documentation API** : http://localhost:3001
- **Health Check** : http://localhost:3001/health

## 📋 Points de Test

### Backend (Port 3001)

- ✅ Endpoint de santé : `/health`
- ✅ Endpoint racine : `/`
- ✅ API des tâches : `/api/tasks`
- ✅ API des tags : `/api/tags`
- ✅ API d'authentification : `/api/auth`

### Frontend (Port 3002)

- ✅ Page d'accueil accessible
- ✅ Assets statiques (CSS, JS, images)
- ✅ Interface utilisateur fonctionnelle
- ✅ Connexion avec l'API backend

### Base de Données

- ✅ Connexion à la base de données
- ✅ Schéma Prisma synchronisé
- ✅ Opérations CRUD fonctionnelles

## 🔧 Configuration

### Variables d'Environnement

Le script utilise les variables d'environnement suivantes :

```bash
# Base de données principale
DATABASE_URL="postgresql://user:password@localhost:5432/gtd_app"

# Base de données de test (optionnelle)
DATABASE_URL_TEST="postgresql://user:password@localhost:5432/gtd_app_test"

# Configuration du serveur
PORT=3001
NODE_ENV=test
JWT_SECRET=your-secret-key
```

### Ports Utilisés

- **Backend** : 3001
- **Frontend** : 3002
- **Base de données** : 5432 (PostgreSQL)

## 🛠️ Dépannage

### Problèmes Courants

1. **Ports déjà utilisés**

   ```bash
   # Vérifier les ports utilisés
   lsof -i :3001
   lsof -i :3002

   # Tuer les processus si nécessaire
   kill -9 <PID>
   ```

2. **Base de données non accessible**

   ```bash
   # Vérifier que PostgreSQL fonctionne
   sudo systemctl status postgresql

   # Redémarrer si nécessaire
   sudo systemctl restart postgresql
   ```

3. **Dépendances manquantes**

   ```bash
   # Réinstaller les dépendances
   npm run install:all
   ```

4. **Build échoué**
   ```bash
   # Nettoyer et rebuilder
   rm -rf backend/dist frontend/dist
   npm run build
   ```

### Logs et Debug

```bash
# Voir les logs du backend
tail -f backend/logs/app.log

# Voir les logs du frontend
tail -f frontend/logs/app.log

# Tester la connexion à la base de données
cd backend && npm run db:studio
```

## 📊 Métriques de Performance

Le script de test mesure :

- **Temps de réponse backend** : < 100ms recommandé
- **Temps de réponse frontend** : < 200ms recommandé
- **Disponibilité des endpoints** : 100% requis
- **Connexion base de données** : Stable requise

## 🚀 Déploiement en Production

Une fois les tests locaux validés :

```bash
# Build pour production
./deploy.sh production

# Les fichiers buildés sont dans :
# - backend/dist/
# - frontend/dist/
```

## 📝 Notes Importantes

1. **Base de données de test** : Utilisez une base séparée pour les tests
2. **Variables d'environnement** : Configurez correctement avant les tests
3. **Ports** : Assurez-vous que les ports 3001 et 3002 sont libres
4. **Dépendances** : Toutes les dépendances doivent être installées
5. **Permissions** : Les scripts doivent être exécutables (`chmod +x`)

## 🔄 Workflow Recommandé

1. **Développement** : `npm run dev` (mode développement)
2. **Test local** : `./deploy.sh test-local` (test de la build)
3. **Validation** : `./test-built-app.sh` (tests automatisés)
4. **Test manuel** : Navigation dans l'application
5. **Déploiement** : `./deploy.sh production` (build final)
