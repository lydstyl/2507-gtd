#!/bin/bash
# =============================================================================
# docker-up.sh — Lance Docker Compose GTD avec le token injecté depuis
# la source unique (~/.hermes/secrets/gtd-api-token)
#
# Usage :
#   ./docker-up.sh              → docker compose up -d (tout)
#   ./docker-up.sh mcp          → docker compose up -d mcp (MCP seulement)
#   ./docker-up.sh --build      → docker compose up -d --build
#   ./docker-up.sh down         → docker compose down
# =============================================================================

set -e

TOKEN_FILE="$HOME/.hermes/secrets/gtd-api-token"
PROJECT_DIR="$HOME/apps/2507-gtd-docker"

if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ Token file not found: $TOKEN_FILE"
    echo "   Create it: echo 'gtd_...' > $TOKEN_FILE && chmod 600 $TOKEN_FILE"
    exit 1
fi

GTD_API_TOKEN=$(cat "$TOKEN_FILE")

if [ -z "$GTD_API_TOKEN" ]; then
    echo "❌ Token file is empty: $TOKEN_FILE"
    exit 1
fi

export GTD_API_TOKEN

cd "$PROJECT_DIR"

echo "🔐 GTD_API_TOKEN loaded from $TOKEN_FILE (${#GTD_API_TOKEN} chars)"
echo "📁 Project: $PROJECT_DIR"
echo "🚀 Running: docker compose up -d $*"
echo ""

# Pass env var through sudo
sudo GTD_API_TOKEN="$GTD_API_TOKEN" docker compose up -d "$@"
