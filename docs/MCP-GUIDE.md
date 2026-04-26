# GTD MCP Server — Guide

## Vue d'ensemble

Le MCP server GTD permet à des assistants IA (Claude Code, Hermes Agent, OpenCode…) de gérer tes tâches et tags via le protocole MCP. Il expose **10 outils** couvrant le CRUD complet.

**Transports supportés :**
- `stdio` — pour Claude Code / Claude Desktop (usage local)
- `http` — pour Hermes Agent et autres clients distants (SaaS)

**Auth :** Bearer token (JWT de connexion ou API key permanente générée depuis l'app).

---

## Outils disponibles

### Tâches
| Outil | Description |
|-------|-------------|
| `list-tasks` | Lister les tâches (filtres : `search`, `isCompleted`, `limit`) |
| `get-task` | Récupérer une tâche par **nom** ou ID |
| `create-task` | Créer une tâche (avec tags par nom ou ID) |
| `update-task` | Modifier une tâche par **nom** ou ID |
| `delete-task` | Supprimer une tâche par **nom** ou ID |
| `complete-task` | Marquer une tâche comme terminée par **nom** ou ID |

### Tags
| Outil | Description |
|-------|-------------|
| `list-tags` | Lister tous les tags |
| `create-tag` | Créer un tag |
| `update-tag` | Modifier un tag par **nom** ou ID |
| `delete-tag` | Supprimer un tag par **nom** ou ID |

> **Nom vs ID :** Tu peux toujours utiliser le nom naturel ("Appeler le dentiste") plutôt qu'un ID. Si plusieurs tâches correspondent, le serveur liste les correspondances et demande de préciser.

---

## Configuration rapide

### 1. Obtenir un token

**Option A — JWT (expire après ~7 jours) :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ton@email.com", "password": "motdepasse"}'
# → { "token": "eyJ..." }
```

**Option B — API Key (recommandée, ne expire pas) :**
```bash
# D'abord login pour obtenir un JWT, puis :
curl -X POST http://localhost:3000/api/auth/keys \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Claude Code perso"}'
# → { "key": "gtd_abc123...", ... }
# ⚠️ La clé est affichée UNE SEULE FOIS, sauvegarde-la !
```

### 2. Build du serveur MCP

```bash
cd mcp-server && npm install && npm run build
```

### 3. Mode stdio (Claude Code)

Édite `.mcp.json` à la racine du projet :
```json
{
  "mcpServers": {
    "gtd-task-manager": {
      "command": "node",
      "args": ["/home/gab/apps/2507-gtd/mcp-server/build/index.js"],
      "env": {
        "GTD_API_TOKEN": "gtd_abc123...",
        "GTD_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

Ou via la commande Claude :
```bash
claude mcp add --transport stdio gtd-task-manager \
  --env GTD_API_TOKEN="gtd_abc123..." \
  --env GTD_API_URL="http://localhost:3000" \
  -- node /home/gab/apps/2507-gtd/mcp-server/build/index.js
```

### 4. Mode HTTP (Hermes Agent, clients distants)

```bash
TRANSPORT=http GTD_API_URL=http://localhost:3000 node mcp-server/build/index.js
# → GTD MCP Server running (HTTP) on port 3001
# → Streamable HTTP: POST http://localhost:3001/mcp
# → SSE (legacy):    GET  http://localhost:3001/sse
```

**Connexion depuis Hermes Agent :**
- URL : `http://localhost:3001/sse`
- Header : `Authorization: Bearer gtd_abc123...`

**Variables d'environnement :**
| Variable | Défaut | Description |
|----------|--------|-------------|
| `TRANSPORT` | `stdio` | `stdio` ou `http` |
| `GTD_API_TOKEN` | — | Ton token (requis en mode stdio) |
| `GTD_API_URL` | `http://localhost:3000` | URL du backend |
| `MCP_HTTP_PORT` | `3001` | Port du serveur HTTP |

---

## Gestion des API Keys

```bash
# Lister tes clés
curl http://localhost:3000/api/auth/keys \
  -H "Authorization: Bearer <token>"

# Créer une clé
curl -X POST http://localhost:3000/api/auth/keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hermes Agent", "expiresAt": "2027-01-01T00:00:00Z"}'

# Révoquer une clé
curl -X DELETE http://localhost:3000/api/auth/keys/<id> \
  -H "Authorization: Bearer <token>"
```

---

## Test avec l'inspecteur MCP

```bash
# Mode SSE (Hermes)
npx @modelcontextprotocol/inspector http://localhost:3001/sse

# Mode stdio
cd mcp-server && npm run inspector
```

---

## Dépannage

**`GTD_API_TOKEN environment variable is required`**
→ Ajoute ton token dans `.mcp.json` ou en variable d'env.

**`Authentication failed — check your API token`**
→ Token invalide ou expiré. Génère une nouvelle API key.

**`Multiple tasks match "…"`**
→ Plusieurs tâches correspondent au nom. Utilise l'ID exact ou un nom plus précis.

**Le serveur MCP n'apparaît pas dans Claude Code**
→ Vérifie que le build existe : `ls mcp-server/build/index.js`
→ Recharge la fenêtre VS Code ou relance le terminal Claude.
