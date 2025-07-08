#!/bin/bash

# Script de configuration pour l'environnement de développement
# Usage: ./setup-dev.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log "🔧 Configuration de l'environnement de développement..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Configuration du backend
log "📝 Configuration du backend..."
cd backend

# Créer le fichier .env pour le backend
cat > .env << EOF
# Configuration du serveur backend
PORT=3000

# Configuration de la base de données
DATABASE_URL="file:./dev.db"

# Configuration JWT (pour l'authentification)
JWT_SECRET="dev-secret-key-change-in-production"

# Configuration CORS (pour le frontend)
CORS_ORIGIN="http://localhost:5173,http://localhost:3001"

# Configuration de l'environnement
NODE_ENV="development"
EOF

log "✅ Fichier .env backend créé"

# Configuration du frontend
cd ../frontend
log "📝 Configuration du frontend..."

# Créer le fichier .env pour le frontend
cat > .env << EOF
# Configuration des ports pour le frontend
# En développement : frontend sur 5173, API sur 3000

# Port du serveur de développement frontend
VITE_FRONTEND_PORT=5173

# Port de l'API backend (en développement)
VITE_API_PORT=3000

# URL de base de l'API (en développement)
VITE_API_BASE_URL=http://localhost:3000
EOF

log "✅ Fichier .env frontend créé"

cd ..

log "🎯 Configuration terminée !"
echo ""
log "📋 Résumé de la configuration :"
echo "   - Backend : http://localhost:3000"
echo "   - Frontend : http://localhost:5173"
echo "   - API : http://localhost:3000/api"
echo ""
info "🚀 Pour démarrer en mode développement :"
echo "   npm run dev"
echo ""
info "🧪 Pour tester l'application buildée :"
echo "   ./deploy.sh test-simple"
echo ""
warn "⚠️  N'oubliez pas de configurer vos propres clés JWT_SECRET en production !" 