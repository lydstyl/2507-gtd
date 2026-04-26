# GTD MCP Server — Setup Guide for Hermes Agent

This document is intended to be read by an AI agent (Hermes or similar) to autonomously configure its connection to the GTD task management MCP server.

## What this MCP server does

It gives you full control over a GTD task manager:
- Create, read, update, delete and complete **tasks**
- Create, read, update, delete **tags**
- All operations accept **task/tag names** (natural language) — you do not need to know IDs

## Prerequisites

The GTD backend must be running. Verify:
```
GET http://localhost:3000/health
→ { "status": "OK" }
```

The MCP server binary must exist:
```
ls /home/gab/apps/2507-gtd/mcp-server/build/index.js
```

If it does not exist, build it:
```bash
cd /home/gab/apps/2507-gtd/mcp-server && npm install && npm run build
```

---

## Step 1 — Get an API Key

You need credentials to authenticate. API keys are permanent (no expiry by default).

### 1a. Login to get a temporary JWT

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "lydstyl@gmail.com", "password": "<PASSWORD>"}'
```

Response:
```json
{ "token": "eyJ...", "user": { "id": "...", "email": "lydstyl@gmail.com" } }
```

Save the `token` value as `<JWT>`.

### 1b. Create a permanent API key

```bash
curl -s -X POST http://localhost:3000/api/auth/keys \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hermes Agent"}'
```

Response:
```json
{
  "id": "...",
  "name": "Hermes Agent",
  "prefix": "gtd_abc12345",
  "key": "gtd_abc123...64chars...",
  "createdAt": "...",
  "expiresAt": null
}
```

**Save the `key` value** — it is shown only once. This is your `<API_KEY>`.

To verify existing keys:
```bash
curl -s http://localhost:3000/api/auth/keys \
  -H "Authorization: Bearer <JWT>"
```

---

## Step 2 — Start the MCP Server in HTTP mode

```bash
TRANSPORT=http \
GTD_API_URL=http://localhost:3000 \
MCP_HTTP_PORT=3001 \
node /home/gab/apps/2507-gtd/mcp-server/build/index.js &
```

Verify it is running:
```bash
curl -s http://localhost:3001/health
→ { "status": "ok", "transport": "http", "port": 3001 }
```

---

## Step 3 — Configure Hermes to connect

Connect Hermes to the MCP server using **SSE transport**:

- **URL**: `http://localhost:3001/sse`
- **Auth header**: `Authorization: Bearer <API_KEY>`
- **Protocol**: MCP over SSE (legacy 2024-11-05, compatible with most agents)

Alternative — Streamable HTTP (newer clients):
- **URL**: `http://localhost:3001/mcp`
- **Auth header**: `Authorization: Bearer <API_KEY>`
- **Protocol**: MCP Streamable HTTP (2025-11-25)

---

## Available Tools

Once connected, you have access to these 10 tools:

### Task tools

| Tool | Description | Key parameters |
|------|-------------|----------------|
| `list-tasks` | List tasks | `search`, `isCompleted`, `limit` |
| `get-task` | Get one task | `taskName` OR `taskId` |
| `create-task` | Create a task | `name` (required), `importance` (0–50), `complexity` (1–9), `plannedDate`, `dueDate`, `tagNames` |
| `update-task` | Update a task | `taskName` OR `taskId`, then any field to change |
| `delete-task` | Delete a task | `taskName` OR `taskId` |
| `complete-task` | Mark as done | `taskName` OR `taskId` |

### Tag tools

| Tool | Description | Key parameters |
|------|-------------|----------------|
| `list-tags` | List all tags | — |
| `create-tag` | Create a tag | `name`, `color` (optional) |
| `update-tag` | Update a tag | `tagName` OR `tagId`, `name`, `color` |
| `delete-tag` | Delete a tag | `tagName` OR `tagId` |

### Name vs ID

- Always prefer `taskName` / `tagName` — use the natural name
- If multiple tasks match the name, the tool returns a list with IDs so you can disambiguate
- `taskId` / `tagId` take priority if both are provided

### Priority system

- `importance`: 0–50 (higher = more important). Default: 10
- `complexity`: 1–9 (higher = more complex). Default: 1
- `points = importance × 10 / complexity` (used for sorting)

---

## Usage Examples

List active tasks:
```
list-tasks { isCompleted: false, limit: 20 }
```

Create a task with a tag:
```
create-task {
  name: "Prepare server backup",
  importance: 30,
  dueDate: "2026-05-01",
  tagNames: ["ops"]
}
```

Complete a task by name:
```
complete-task { taskName: "Prepare server backup" }
```

Update importance by name:
```
update-task { taskName: "Deploy update", importance: 40 }
```

---

## Troubleshooting

**401 Unauthorized**
→ Check the API key: `curl http://localhost:3001/health` should respond OK
→ Regenerate an API key via Step 1

**MCP server not found / port 3001 not open**
→ Start the MCP server (Step 2)
→ Check process: `lsof -i :3001`

**"Multiple tasks match …"**
→ Use a more specific name or copy the exact `taskId` from the error message

**Backend not reachable**
→ Check backend: `curl http://localhost:3000/health`
→ Start backend: `cd /home/gab/apps/2507-gtd && npm run dev`
