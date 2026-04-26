# Plan : MCP Server Remote + CRUD complet + API Keys

## Contexte

L'app GTD sera un SaaS avec ~300 utilisateurs. Le MCP server existant (`/mcp-server/`) est minimal :
2 outils, transport stdio uniquement, accès direct à la DB avec `userId/userEmail` en paramètre admin.

Objectif : transformer le MCP server en serveur distant (HTTP/SSE) avec auth par token utilisateur,
CRUD complet des tâches/tags, et des API keys durables — pour que des outils comme Hermes Agent,
Claude Code, OpenCode puissent s'y connecter.

## Architecture cible

```
Hermes / Claude Code / OpenCode
        ↓  MCP protocol (HTTP SSE ou stdio)
   MCP Server (port 3001)
        ↓  REST API + Bearer token
   Backend Express (port 3000)
        ↓  Prisma
   PostgreSQL
```

Le MCP server devient un proxy REST : plus d'accès direct à la DB, plus de `userId/userEmail`
en paramètre. L'identité vient du Bearer token configuré par l'utilisateur.

---

## Phase 1 — API Keys dans le backend

### 1.1 — Prisma : modèle `ApiKey`

Fichier : `backend/prisma/schema.prisma`

```prisma
model ApiKey {
  id         String    @id @default(cuid())
  name       String
  keyHash    String    @unique
  prefix     String
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastUsedAt DateTime?
  createdAt  DateTime  @default(now())
  expiresAt  DateTime?
  @@map("api_keys")
}
```

Format clé brute : `gtd_` + 64 hex chars. Stocker `bcrypt.hash(rawKey)` en DB,
stocker les 12 premiers chars comme `prefix` pour lookup rapide.

### 1.2 — Interface + Repository

- `backend/src/interfaces/repositories/IApiKeyRepository.ts`
- `backend/src/infrastructure/repositories/PrismaApiKeyRepository.ts`

### 1.3 — Use Cases

- `CreateApiKeyUseCase` → retourne la clé brute **une seule fois**
- `ListApiKeysUseCase` → retourne `id, name, prefix, lastUsedAt, createdAt, expiresAt`
- `RevokeApiKeyUseCase`

### 1.4 — Controller + Routes

Endpoints sous `/api/auth/keys` :
- `GET /` — lister les clés
- `POST /` — créer (body: `{ name, expiresAt? }`) → retourne la clé brute
- `DELETE /:id` — révoquer

### 1.5 — Auth middleware : accepter les API keys

`backend/src/presentation/middleware/authMiddleware.ts` devient async.

Logique :
1. Si token commence par `gtd_` → lookup API key via prefix (12 chars)
2. `bcrypt.compare(token, keyHash)` pour chaque candidat
3. Si match et non expiré → `updateLastUsed()`, `req.user = { userId }`
4. Sinon → essayer `jwt.verify()` (comportement actuel)

---

## Phase 2 — Refactoring MCP Server

### 2.1 — Dépendances

`mcp-server/package.json` :
- `@modelcontextprotocol/sdk` : `^0.6.0` → `^1.29.0`
- Ajouter : `express ^5.1.0`, `cors ^2.8.5`
- Supprimer : `@prisma/client`, `prisma`

`tsconfig.json` : `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`

### 2.2 — ApiClient

`mcp-server/src/client/ApiClient.ts` : wrape toutes les routes REST avec Bearer token.
`mcp-server/src/client/types.ts` : interfaces DTO (TaskDto, TagDto, etc.)

### 2.3 — Outils : nom en priorité, ID en fallback

Pour tout outil ciblant une tâche/tag existante :
- Accepter `taskId` (cuid) OU `taskName` (recherche insensible à la casse)
- Si `taskName` correspond à plusieurs tâches → erreur avec liste des correspondances + IDs
- Même logique pour tags : `tagId` OU `tagName`

**Tâches** (`mcp-server/src/tools/tasks.ts`) :

| Outil | Endpoint | Identification |
|-------|----------|---------------|
| `list-tasks` | `GET /api/tasks` | filtres : `search?`, `isCompleted?`, `limit?` |
| `get-task` | `GET /api/tasks/:id` | `taskId` OU `taskName` |
| `create-task` | `POST /api/tasks` | `name` requis, `tagNames?` ou `tagIds?` |
| `update-task` | `PUT /api/tasks/:id` | `taskId` OU `taskName` |
| `delete-task` | `DELETE /api/tasks/:id` | `taskId` OU `taskName` |
| `complete-task` | `POST /api/tasks/:id/complete` | `taskId` OU `taskName` |

**Tags** (`mcp-server/src/tools/tags.ts`) :

| Outil | Endpoint | Identification |
|-------|----------|---------------|
| `list-tags` | `GET /api/tags` | — |
| `create-tag` | `POST /api/tags` | `name` requis |
| `update-tag` | `PUT /api/tags/:id` | `tagId` OU `tagName` |
| `delete-tag` | `DELETE /api/tags/:id` | `tagId` OU `tagName` |

### 2.4 — Dual transport (`src/index.ts`)

**Mode stdio** (défaut, Claude Code desktop) :
- `GTD_API_TOKEN` env var obligatoire
- Connecte `StdioServerTransport`

**Mode HTTP** (`TRANSPORT=http`, Hermes/SaaS) :
- Express sur `MCP_HTTP_PORT` (défaut: 3001)
- `POST /mcp` → `StreamableHTTPServerTransport` (protocole 2025-11-25)
- `GET /sse` + `POST /messages` → `SSEServerTransport` (protocole 2024-11-05, compatibilité Hermes)
- Auth : Bearer token extrait du header par session

### 2.5 — Fichiers supprimés

- `mcp-server/src/config/database.ts`
- `mcp-server/src/tools/createTask.ts`
- `mcp-server/src/tools/listTasks.ts`
- `mcp-server/src/types/task.ts`

---

## Ordre d'implémentation

1. Phase 1 complète (backend API keys)
2. Test avec curl : créer clé, l'utiliser sur `/api/tasks`
3. Phase 2 : upgrade SDK + ApiClient + outils (sans changer transport)
4. Test stdio avec `GTD_API_TOKEN=<clé>`
5. Ajouter HTTP transport
6. Test Hermes via `http://localhost:3001/sse`

---

## Vérification end-to-end

```bash
# 1. Créer une API key
curl -X POST http://localhost:3000/api/auth/keys \
  -H "Authorization: Bearer <JWT>" \
  -d '{"name": "Test Hermes"}'
# → { "key": "gtd_abc123..." }

# 2. Utiliser la clé
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer gtd_abc123..."

# 3. Lancer MCP en mode HTTP
TRANSPORT=http GTD_API_URL=http://localhost:3000 node mcp-server/build/index.js

# 4. Tester avec l'inspecteur MCP
npx @modelcontextprotocol/inspector http://localhost:3001/sse
```
