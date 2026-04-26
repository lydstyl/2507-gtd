# Plan d'intégration avec les Agents IA externes

## Objectif
Permettre à des agents IA externes (OpenClaw, Hermes, Claude Code, etc.) de créer, modifier et supprimer des tâches dans l'application GTD de manière sécurisée et "futurproof".

---

## Architecture recommandée : Multi-modal

### 1. Système de Clés API (Backend)

**Pourquoi :** Si l'application devient un SaaS, chaque utilisateur doit pouvoir générer des clés API pour ses propres agents.

**Implémentation :**
```typescript
// Nouvelle entité ApiKey dans Prisma
model ApiKey {
  id          String   @id @default(cuid())
  name        String   // Nom de la clé (ex: "Hermes Agent")
  keyHash     String   // Hash de la clé (jamais stockée en clair)
  keyPrefix   String   // Prefix pour identifier la clé (ex: "gtd_abc123")
  permissions String[] // ['tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete']
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_keys")
}
```

**Avantages :**
- Chaque utilisateur peut avoir plusieurs clés
- Révocation facile si une clé est compromise
- Permissions granulaires
- Traçabilité (lastUsedAt)

---

### 2. MCP Server (Model Context Protocol)

**Pourquoi :** MCP est le standard émergent d'Anthropic pour connecter les LLMs à des outils externes. Claude Code utilise déjà MCP.

**Architecture MCP :**
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│  MCP Server  │────▶│  GTD Backend    │
│  (ou autre LLM) │     │   (local)    │     │  (REST API)     │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

**Fonctionnalités MCP exposées :**
- `list_tasks` - Lister les tâches avec filtres
- `create_task` - Créer une nouvelle tâche
- `update_task` - Modifier une tâche existante
- `delete_task` - Supprimer une tâche
- `complete_task` - Marquer comme complétée
- `get_task_stats` - Statistiques des tâches

**Exemple de configuration MCP pour Claude Code :**
```json
{
  "mcpServers": {
    "gtd": {
      "command": "npx",
      "args": ["-y", "@gtd/mcp-server@latest"],
      "env": {
        "GTD_API_URL": "https://api.gtd-app.com",
        "GTD_API_KEY": "votre-cle-api"
      }
    }
  }
}
```

---

### 3. Endpoints API REST (existant + amélioré)

**Authentification hybride :**
- JWT pour les utilisateurs web (existant)
- API Key pour les agents externes (nouveau)

**Middleware d'authentification API Key :**
```typescript
// middleware/apiKeyAuth.ts
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')

  if (!apiKey) return next() // Passer au middleware JWT

  const keyData = await validateApiKey(apiKey)
  if (!keyData) return res.status(401).json({ error: 'Invalid API key' })

  req.userId = keyData.userId
  req.apiKeyPermissions = keyData.permissions
  next()
}
```

**Endpoints déjà existants (compatibles agents) :**
- `GET /api/tasks` - Lister les tâches
- `POST /api/tasks` - Créer une tâche
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche
- `POST /api/tasks/:id/complete` - Compléter une tâche

---

### 4. SDK/Client officiel (optionnel mais recommandé)

**Package npm `@gtd/api-client` :**
```typescript
import { GtdClient } from '@gtd/api-client'

const client = new GtdClient({
  apiUrl: 'https://api.gtd-app.com',
  apiKey: 'votre-cle-api'
})

// Créer une tâche
await client.tasks.create({
  name: 'Réviser le projet',
  status: 'pret',
  importance: 100
})
```

---

## Roadmap d'implémentation

### Phase 1 : Système de clés API (Backend)
- [ ] Ajouter le modèle `ApiKey` à Prisma
- [ ] Créer les migrations
- [ ] Implémenter le middleware d'authentification API Key
- [ ] Créer les endpoints de gestion des clés API :
  - `POST /api/api-keys` - Créer une clé
  - `GET /api/api-keys` - Lister les clés
  - `DELETE /api/api-keys/:id` - Révoquer une clé
- [ ] Interface utilisateur pour gérer les clés (frontend)

### Phase 2 : MCP Server
- [ ] Créer un package `@gtd/mcp-server`
- [ ] Implémenter les outils MCP (list_tasks, create_task, etc.)
- [ ] Publier sur npm
- [ ] Documentation d'installation

### Phase 3 : Documentation et SDK
- [ ] Documentation OpenAPI/Swagger
- [ ] Guide d'intégration pour les développeurs
- [ ] SDK TypeScript (optionnel)
- [ ] Exemples de code pour différents agents

---

## Comparaison des approches pour les agents

| Approche | Avantage | Inconvénient | Recommandé pour |
|----------|----------|--------------|-----------------|
| **API Key + REST** | Simple, universel | Nécessite une intégration custom | Agents custom, scripts |
| **MCP Server** | Standard, tool-calling natif | Nécessite MCP support | Claude Code, Cursor, etc. |
| **SDK officiel** | Facile d'utilisation | Dépendance supplémentaire | Développeurs tiers |

---

## Recommandation pour ton cas (OpenClaw / Hermes)

### Option A : API Key + REST (Recommandé pour commencer)

**Pourquoi :**
- OpenClaw et Hermes peuvent faire des appels HTTP
- Pas de dépendance à un protocole spécifique
- Fonctionne immédiatement

**Comment :**
1. Générer une clé API dans l'interface GTD
2. Configurer OpenClaw/Hermes pour utiliser cette clé
3. Exemple de configuration OpenClaw :
```yaml
integrations:
  gtd:
    type: http
    base_url: https://ton-domaine.com/api
    headers:
      Authorization: Bearer ${GTD_API_KEY}
    tools:
      - name: create_task
        endpoint: POST /tasks
        description: "Créer une nouvelle tâche"
```

### Option B : MCP Server (Pour l'avenir)

**Si OpenClaw/Hermes supporte MCP :**
- Installation : `npx -y @gtd/mcp-server`
- Configuration via variables d'environnement

---

## Questions à considérer

1. **Quelles permissions par défaut pour une nouvelle clé API ?**
   - Recommandé : lecture + écriture (full access)
   - Option avancée : permissions granulaires

2. **Faut-il limiter le nombre de clés par utilisateur ?**
   - Recommandé : 5-10 clés max

3. **Logging des actions API ?**
   - Oui, pour traçabilité et debug

4. **Rate limiting ?**
   - Recommandé : 100 req/min par clé API

---

## Exemple complet : Créer une tâche via API

```bash
# Avec curl
curl -X POST https://api.gtd-app.com/api/tasks \
  -H "Authorization: Bearer gtd_sk_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Réviser le projet GTD",
    "status": "pret",
    "importance": 250,
    "complexity": 3,
    "plannedDate": "2026-04-26"
  }'
```

```javascript
// Avec fetch
const response = await fetch('https://api.gtd-app.com/api/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer gtd_sk_abc123xyz',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Réviser le projet GTD',
    status: 'pret',
    importance: 250,
    complexity: 3,
    plannedDate: '2026-04-26'
  })
})
```

---

## Prochaines étapes

1. **Valider ce plan avec tes besoins spécifiques**
2. **Implémenter le système de clés API** (priorité haute)
3. **Tester avec OpenClaw/Hermes** en utilisant l'API REST existante
4. **Développer le MCP Server** si nécessaire

**Souhaites-tu que j'implémente le système de clés API maintenant, ou préfères-tu tester d'abord avec l'API existante et une clé manuelle ?**
