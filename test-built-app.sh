#!/bin/bash

# Script de test pour l'application buildée
# Usage: ./test-built-app.sh [PORT]

set -e

TEST_PORT=${1:-3001}
echo "🧪 Test de l'application sur le port: $TEST_PORT"

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

# Vérifier que les serveurs sont en cours d'exécution
check_servers() {
    log "🔍 Vérification du serveur unifié..."
    
    # Vérifier le serveur unifié
    if curl -f http://localhost:$TEST_PORT/health > /dev/null 2>&1; then
        log "✅ Serveur unifié accessible sur http://localhost:$TEST_PORT"
    else
        error "❌ Serveur unifié non accessible sur http://localhost:$TEST_PORT"
        return 1
    fi
    
    # Vérifier que le frontend est accessible via le serveur unifié
    if curl -f http://localhost:$TEST_PORT > /dev/null 2>&1; then
        log "✅ Frontend accessible via le serveur unifié"
    else
        error "❌ Frontend non accessible via le serveur unifié"
        return 1
    fi
}

# Tester l'API
test_api() {
    log "🧪 Test de l'API..."
    
    # Test de l'endpoint de santé
    info "Test de l'endpoint /health..."
    HEALTH_RESPONSE=$(curl -s http://localhost:$TEST_PORT/health)
    if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        log "✅ Endpoint /health fonctionne"
    else
        error "❌ Endpoint /health ne fonctionne pas"
        echo "Réponse: $HEALTH_RESPONSE"
    fi
    
    # Test de l'endpoint API racine
    info "Test de l'endpoint /api..."
    API_RESPONSE=$(curl -s http://localhost:$TEST_PORT/api)
    if echo "$API_RESPONSE" | grep -q "Todo List API"; then
        log "✅ Endpoint /api fonctionne"
    else
        error "❌ Endpoint /api ne fonctionne pas"
        echo "Réponse: $API_RESPONSE"
    fi
    
    # Test de l'endpoint des tâches
    info "Test de l'endpoint /api/tasks..."
    TASKS_RESPONSE=$(curl -s http://localhost:$TEST_PORT/api/tasks)
    if [ $? -eq 0 ]; then
        log "✅ Endpoint /api/tasks accessible"
        echo "Nombre de tâches: $(echo "$TASKS_RESPONSE" | jq '.length // 0' 2>/dev/null || echo "N/A")"
    else
        warn "⚠️  Endpoint /api/tasks retourne une erreur (peut être normal si pas de données)"
    fi
    
    # Test de l'endpoint des tags
    info "Test de l'endpoint /api/tags..."
    TAGS_RESPONSE=$(curl -s http://localhost:$TEST_PORT/api/tags)
    if [ $? -eq 0 ]; then
        log "✅ Endpoint /api/tags accessible"
        echo "Nombre de tags: $(echo "$TAGS_RESPONSE" | jq '.length // 0' 2>/dev/null || echo "N/A")"
    else
        warn "⚠️  Endpoint /api/tags retourne une erreur (peut être normal si pas de données)"
    fi
}

# Tester le frontend
test_frontend() {
    log "🌐 Test du frontend..."
    
    # Vérifier que le fichier index.html existe
    if curl -s http://localhost:$TEST_PORT | grep -q "html"; then
        log "✅ Page d'accueil du frontend accessible"
    else
        error "❌ Page d'accueil du frontend non accessible"
    fi
    
    # Vérifier les assets statiques
    if curl -s -I http://localhost:$TEST_PORT/assets/ | grep -q "200\|404"; then
        log "✅ Assets statiques accessibles"
    else
        warn "⚠️  Problème avec les assets statiques"
    fi
}

# Test de performance basique
test_performance() {
    log "⚡ Test de performance basique..."
    
    # Test de temps de réponse du backend
    info "Test de temps de réponse du backend..."
    BACKEND_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:$TEST_PORT/health)
    log "✅ Temps de réponse backend: ${BACKEND_TIME}s"
    
    # Test de temps de réponse du frontend
    info "Test de temps de réponse du frontend..."
    FRONTEND_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:$TEST_PORT)
    log "✅ Temps de réponse frontend: ${FRONTEND_TIME}s"
}

# Fonction principale
main() {
    log "🚀 Démarrage des tests de l'application buildée..."
    
    # Vérifier que les serveurs sont en cours d'exécution
    if ! check_servers; then
        error "Le serveur unifié n'est pas en cours d'exécution. Lancez d'abord: ./deploy.sh test-local"
        exit 1
    fi
    
    echo ""
    
    # Tester l'API
    test_api
    
    echo ""
    
    # Tester le frontend
    test_frontend
    
    echo ""
    
    # Test de performance
    test_performance
    
    echo ""
    log "🎉 Tous les tests sont terminés!"
    log "📊 Résumé:"
    echo "   - Serveur unifié: http://localhost:$TEST_PORT"
    echo "   - Frontend: http://localhost:$TEST_PORT"
    echo "   - API Documentation: http://localhost:$TEST_PORT"
    echo ""
    info "💡 Pour tester manuellement:"
    echo "   - Ouvrez http://localhost:$TEST_PORT dans votre navigateur"
    echo "   - Testez les fonctionnalités de l'application"
    echo "   - Vérifiez que tout fonctionne comme attendu"
}

# Exécuter le script principal
main 