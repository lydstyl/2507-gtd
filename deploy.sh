#!/bin/bash

# Script de déploiement pour l'application GTD
# Usage: ./deploy.sh [production|staging|test-local|test-simple] [PORT]

set -e  # Arrêter en cas d'erreur

ENVIRONMENT=${1:-production}
CUSTOM_PORT=${2:-3001}
echo "🚀 Déploiement en mode: $ENVIRONMENT sur le port: $CUSTOM_PORT"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Fonction pour tester l'application buildée localement (sans base de données)
test_built_application_simple() {
    log "🧪 Test simple de l'application buildée localement..."
    
    # Vérifier que le build existe
    if [ ! -d "backend/dist" ]; then
        error "Le dossier backend/dist n'existe pas. Lancez d'abord le build."
        exit 1
    fi
    
    if [ ! -d "frontend/dist" ]; then
        error "Le dossier frontend/dist n'existe pas. Lancez d'abord le build."
        exit 1
    fi
    
    # Démarrer le serveur backend en arrière-plan (sans base de données)
    info "🚀 Démarrage du serveur unifié (backend + frontend) sur le port $CUSTOM_PORT..."
    cd backend
    
    # Créer un fichier .env temporaire pour le test
    echo "DATABASE_URL=\"file:./test.db\"" > .env
    echo "JWT_SECRET=\"test-secret-key\"" >> .env
    echo "PORT=$CUSTOM_PORT" >> .env
    echo "NODE_ENV=production" >> .env
    
    # Générer le client Prisma
    npm run db:generate
    
    # Démarrer le serveur unifié
    PORT=$CUSTOM_PORT NODE_ENV=production npm run start &
    BACKEND_PID=$!
    
    # Attendre que le serveur démarre
    sleep 5
    
    # Vérifier que le serveur fonctionne
    if curl -f http://localhost:$CUSTOM_PORT/health > /dev/null 2>&1; then
        log "✅ Serveur unifié démarré avec succès sur le port $CUSTOM_PORT"
    else
        error "❌ Le serveur unifié n'a pas démarré correctement sur le port $CUSTOM_PORT"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Vérifier que le frontend est accessible
    if curl -f http://localhost:$CUSTOM_PORT > /dev/null 2>&1; then
        log "✅ Frontend accessible via le serveur unifié"
    else
        error "❌ Le frontend n'est pas accessible via le serveur unifié"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Afficher les informations de test
    echo ""
    log "🎯 Application testée avec succès!"
    echo "   - Serveur unifié: http://localhost:$CUSTOM_PORT"
    echo "   - API: http://localhost:$CUSTOM_PORT/api"
    echo "   - Frontend: http://localhost:$CUSTOM_PORT"
    echo "   - Base de données: SQLite (test.db)"
    echo ""
    info "📋 Tests disponibles:"
    echo "   - Test API: curl http://localhost:$CUSTOM_PORT/api/tasks"
    echo "   - Test Frontend: Ouvrir http://localhost:$CUSTOM_PORT dans votre navigateur"
    echo ""
    warn "⚠️  Appuyez sur Ctrl+C pour arrêter le serveur de test"
    
    # Attendre l'interruption de l'utilisateur
    trap 'cleanup_test_servers' INT
    wait
}

# Fonction pour tester l'application buildée localement
test_built_application() {
    log "🧪 Test de l'application buildée localement..."
    
    # Vérifier que le build existe
    if [ ! -d "backend/dist" ]; then
        error "Le dossier backend/dist n'existe pas. Lancez d'abord le build."
        exit 1
    fi
    
    if [ ! -d "frontend/dist" ]; then
        error "Le dossier frontend/dist n'existe pas. Lancez d'abord le build."
        exit 1
    fi
    
    # Démarrer la base de données de test si nécessaire
    info "🔧 Vérification de la base de données de test..."
    cd backend
    
    # Vérifier si une base de données de test existe
    if [ -z "$DATABASE_URL_TEST" ]; then
        warn "DATABASE_URL_TEST non définie, utilisation de la base de développement"
        export DATABASE_URL_TEST="$DATABASE_URL"
    fi
    
    # Générer le client Prisma
    npm run db:generate
    
    # Pousser le schéma vers la base de test
    DATABASE_URL="$DATABASE_URL_TEST" npm run db:push
    
    # Démarrer le serveur backend en arrière-plan
    info "🚀 Démarrage du serveur backend buildé..."
    PORT=$CUSTOM_PORT NODE_ENV=test DATABASE_URL="$DATABASE_URL_TEST" npm run start &
    BACKEND_PID=$!
    
    # Attendre que le serveur démarre
    sleep 5
    
    # Vérifier que le serveur fonctionne
    if curl -f http://localhost:$CUSTOM_PORT/health > /dev/null 2>&1; then
        log "✅ Serveur backend démarré avec succès sur le port $CUSTOM_PORT"
    else
        error "❌ Le serveur backend n'a pas démarré correctement"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Démarrer le serveur frontend en arrière-plan
    info "🌐 Démarrage du serveur frontend buildé..."
    cd ../frontend
    npx serve -s dist -l $((CUSTOM_PORT + 1)) &
    FRONTEND_PID=$!
    
    # Attendre que le serveur démarre
    sleep 3
    
    # Vérifier que le serveur fonctionne
    if curl -f http://localhost:$((CUSTOM_PORT + 1)) > /dev/null 2>&1; then
        log "✅ Serveur frontend démarré avec succès sur le port $((CUSTOM_PORT + 1))"
    else
        error "❌ Le serveur frontend n'a pas démarré correctement"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Afficher les informations de test
    echo ""
    log "🎯 Application testée avec succès!"
    echo "   - Backend: http://localhost:$CUSTOM_PORT"
    echo "   - Frontend: http://localhost:$((CUSTOM_PORT + 1))"
    echo "   - Base de données: Test"
    echo ""
    info "📋 Tests disponibles:"
    echo "   - Test API: curl http://localhost:$CUSTOM_PORT/api/tasks"
    echo "   - Test Frontend: Ouvrir http://localhost:$((CUSTOM_PORT + 1)) dans votre navigateur"
    echo ""
    warn "⚠️  Appuyez sur Ctrl+C pour arrêter les serveurs de test"
    
    # Attendre l'interruption de l'utilisateur
    trap 'cleanup_test_servers' INT
    wait
}

# Fonction pour nettoyer les serveurs de test
cleanup_test_servers() {
    echo ""
    log "🧹 Arrêt des serveurs de test..."
    kill $BACKEND_PID 2>/dev/null || true
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    log "✅ Serveurs arrêtés"
    exit 0
}

# Fonction de build standard
build_application() {
    log "📦 Installation des dépendances..."
    npm run install:all

    log "🔨 Build du backend..."
    cd backend
    npm run build
    cd ..

    log "🔨 Build du frontend..."
    cd frontend
    
    # Configuration des variables d'environnement pour le build
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "test-simple" ]; then
        # Mode production/staging/test-simple : serveur unifié sur le port personnalisé
        export NODE_ENV=production
        export VITE_API_PORT=$CUSTOM_PORT
        export VITE_FRONTEND_PORT=$CUSTOM_PORT
        log "🔧 Configuration frontend pour serveur unifié (port $CUSTOM_PORT) en mode production"
    else
        # Mode test-local : backend et frontend séparés
        export NODE_ENV=development
        export VITE_API_PORT=$CUSTOM_PORT
        export VITE_FRONTEND_PORT=$((CUSTOM_PORT + 1))
        log "🔧 Configuration frontend pour test-local (backend: $CUSTOM_PORT, frontend: $((CUSTOM_PORT + 1)))"
    fi
    
    npm run build
    cd ..

    log "✅ Build terminé avec succès!"
}

# Fonction de déploiement standard
deploy_application() {
    log "📋 Résumé du déploiement:"
    echo "   - Backend: backend/dist/"
    echo "   - Frontend: frontend/dist/"
    echo "   - Environnement: $ENVIRONMENT"

    log "🎯 Prochaines étapes:"
    echo "   1. Copier les fichiers sur ton serveur"
    echo "   2. Configurer les variables d'environnement"
    echo "   3. Installer PostgreSQL sur le serveur"
    echo "   4. Configurer PM2 ou systemd"
    echo "   5. Configurer Nginx comme reverse proxy"

    log "📚 Documentation de déploiement créée dans DEPLOYMENT.md"
}

# Logique principale
case $ENVIRONMENT in
    "test-simple")
        log "🧪 Mode test simple activé"
        build_application
        test_built_application_simple
        ;;
    "test-local")
        log "🧪 Mode test local activé"
        build_application
        test_built_application
        ;;
    "production"|"staging")
        log "🚀 Mode déploiement: $ENVIRONMENT"
        build_application
        log "🧪 Test de l'application buildée avant déploiement..."
        test_built_application_simple
        ;;
    *)
        error "Environnement invalide. Utilisez: production, staging, test-local, ou test-simple"
        echo "Usage: ./deploy.sh [production|staging|test-local|test-simple]"
        exit 1
        ;;
esac 