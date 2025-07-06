#!/bin/bash

# Script de déploiement pour l'application GTD
# Usage: ./deploy.sh [production|staging]

set -e  # Arrêter en cas d'erreur

ENVIRONMENT=${1:-production}
echo "🚀 Déploiement en mode: $ENVIRONMENT"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

log "📦 Installation des dépendances..."
npm run install:all

log "🔨 Build du backend..."
cd backend
npm run build
cd ..

log "🔨 Build du frontend..."
cd frontend
npm run build
cd ..

log "✅ Build terminé avec succès!"

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