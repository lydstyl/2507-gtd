# GTD MCP Server - Quick Start Guide

## What is this?

The GTD MCP Server allows Claude Code (and other MCP-compatible AI assistants) to manage tasks in your GTD system with two tools:
- **`create-task-for-user`** - Create new tasks
- **`list-tasks-for-user`** - List and filter tasks

**New Features:**
- ✅ Use email instead of user ID (e.g., `gab@example.com` instead of `cmgsjy73j00008gxp9tqjmpsw`)
- ✅ List tasks with filters (planned date, due date, completion status)
- ✅ Support for planned dates (when you plan to work on a task)

## Quick Start (3 Steps)

```bash
# 1. Build the MCP server
cd mcp-server && npm install && npm run build

# 2. Add to Claude Code (replace path with your actual path!)
claude mcp add --transport stdio gtd-task-manager \
  --env DATABASE_URL="file:/home/gab/apps/2507-gtd/backend/prisma/dev.db" \
  -- node /home/gab/apps/2507-gtd/mcp-server/build/index.js

# 3. Verify it's working
claude mcp list
```

Then restart Claude Code (VSCode: Reload Window, CLI: restart terminal).

## Setup Instructions

### 1. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure MCP Server

**IMPORTANT:** Claude Code reads MCP servers from the global configuration file. Choose ONE of the following methods:

#### Method 1: Using `claude mcp add` Command (Recommended ✅)

This is the easiest and safest method. It automatically updates your configuration:

```bash
# Add the GTD MCP server with environment variable
claude mcp add --transport stdio gtd-task-manager \
  --env DATABASE_URL="file:/home/gab/apps/2507-gtd/backend/prisma/dev.db" \
  -- node /home/gab/apps/2507-gtd/mcp-server/build/index.js
```

**Important:** Replace `/home/gab/apps/2507-gtd/` with your actual project path!

To verify it was added:
```bash
claude mcp list
```

To remove it if needed:
```bash
claude mcp remove gtd-task-manager
```

#### Method 2: Manual Configuration (~/.config/Claude/claude_desktop_config.json)

Alternatively, manually add the GTD MCP server to your global Claude Desktop config file at `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dice-roller": {
      "command": "node",
      "args": ["/home/gab/apps/250913-first-mcp/dist/server.js"]
    },
    "gtd-task-manager": {
      "command": "node",
      "args": ["/home/gab/apps/2507-gtd/mcp-server/build/index.js"],
      "env": {
        "DATABASE_URL": "file:/home/gab/apps/2507-gtd/backend/prisma/dev.db"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/home/gab/apps/2507-gtd/` with your actual project path
- Use **absolute paths** - relative paths and `${WORKSPACE_DIR}` are not supported in global config
- This file is shared between Claude Desktop app and Claude Code CLI
- After updating, restart Claude Code for changes to take effect

### 3. Approve the MCP Server

When you first open Claude Code in this project:
1. Claude Code will prompt you to approve the `gtd-task-manager` MCP server
2. Click "Approve" to allow Claude to use it
3. If you need to reset approval choices: `claude mcp reset-project-choices`

### 4. Verify Connection

Use `/mcp` command in Claude Code to see available MCP servers. You should see `gtd-task-manager` listed with the `create-task-for-user` tool.

## Usage Examples

### Basic Task Creation

```
Create a task for user clzr52iyk0000ufw2qj88kfgq with the name "Review Q4 budget"
```

### Task with Priority Settings

```
Create a high-priority task for user clzr52iyk0000ufw2qj88kfgq:
- Name: "Fix production database performance issue"
- Importance: 1
- Urgency: 1
- Priority: 1
```

### Task with Due Date

```
Create a task for user clzr52iyk0000ufw2qj88kfgq:
- Name: "Submit expense report"
- Due date: 2024-03-15
- Importance: 3
- Urgency: 2
```

### Task with Notes and Link

```
Create a task for user clzr52iyk0000ufw2qj88kfgq:
- Name: "Review PR #234"
- Link: https://github.com/myorg/myrepo/pull/234
- Note: "Focus on the authentication changes in src/auth/"
- Importance: 2
```

### Creating a Subtask

```
Create a subtask under task abc123 for user clzr52iyk0000ufw2qj88kfgq:
- Name: "Write unit tests"
- Importance: 2
- Urgency: 3
```

### Task with Tags

First, you'll need to know your tag IDs. Then:

```
Create a task for user clzr52iyk0000ufw2qj88kfgq:
- Name: "Plan team offsite"
- Tag IDs: ["tag-id-1", "tag-id-2"]
- Due date: 2024-04-01
```

## Getting Your User ID

You can find your user ID by:

1. Opening the app at `http://localhost:5173`
2. Opening browser DevTools (F12)
3. Going to Application → Local Storage
4. Looking for the `auth` key - your user ID is in the token payload

Or query the database directly:

```bash
cd backend
sqlite3 prisma/dev.db "SELECT id, email FROM User;"
```

## Outils Disponibles / Available Tools

### 1. create-task-for-user
Créer une nouvelle tâche pour un utilisateur spécifique.

### 2. list-tasks-for-user
Lister les tâches d'un utilisateur avec filtres optionnels.

## Paramètres des Outils / Tool Parameters

### create-task-for-user

**Paramètres Requis / Required:**
- `name` (string) - Nom de la tâche / Task name

**Paramètres Optionnels / Optional:**
- `userId` (string) - ID de l'utilisateur (ou userEmail) / User ID (or userEmail)
- `userEmail` (string) - Email de l'utilisateur (ou userId) / User email (or userId)
- `importance` (number 1-100) - Niveau d'importance (défaut: 50) / Importance level (default: 50)
- `complexity` (number 1-5) - Niveau de complexité (défaut: 1) / Complexity level (default: 1)
- `plannedDate` (string) - Date prévue au format ISO (AAAA-MM-JJ) / Planned date in ISO format (YYYY-MM-DD)
- `dueDate` (string) - Date d'échéance au format ISO (AAAA-MM-JJ) / Due date in ISO format (YYYY-MM-DD)
- `link` (string) - URL associée / Associated URL
- `note` (string) - Notes en texte riche / Rich text notes
- `parentId` (string) - ID de la tâche parente pour créer une sous-tâche / Parent task ID for creating subtasks
- `tagIds` (array of strings) - IDs des étiquettes à associer / Tag IDs to associate

### list-tasks-for-user

**Paramètres Optionnels / Optional:**
- `userId` (string) - ID de l'utilisateur (ou userEmail) / User ID (or userEmail)
- `userEmail` (string) - Email de l'utilisateur (ou userId) / User email (or userId)
- `isCompleted` (boolean) - Filtrer par statut (vrai = complété, faux = non complété) / Filter by status (true = completed, false = not completed)
- `plannedDate` (string) - Filtrer par date prévue au format ISO (AAAA-MM-JJ) / Filter by planned date in ISO format (YYYY-MM-DD)
- `dueDate` (string) - Filtrer par date d'échéance au format ISO (AAAA-MM-JJ) / Filter by due date in ISO format (YYYY-MM-DD)
- `limit` (number 1-100) - Nombre maximum de tâches à retourner (défaut: 50) / Maximum number of tasks to return (default: 50)

## Exemples en Français / French Examples

### Créer une tâche / Create a task

```
Créer une tâche pour l'utilisateur gab@example.com avec le nom "Appeler le dentiste"
```

```
Créer une tâche importante pour gab@example.com :
- Nom: "Réviser le rapport financier Q4"
- Importance: 80
- Complexité: 3
- Date prévue: 2025-10-20
```

```
Ajouter une tâche pour gab@example.com :
- Nom: "Organiser la réunion d'équipe"
- Date d'échéance: 2025-10-18
- Note: "Inviter tous les chefs de projet"
```

### Lister les tâches / List tasks

```
Lister toutes les tâches non complétées pour gab@example.com
```

```
Afficher les tâches prévues pour aujourd'hui pour gab@example.com
```

```
Montrer les tâches avec date d'échéance pour demain pour l'utilisateur gab@example.com
```

```
Lister les 20 premières tâches pour gab@example.com
```

### Exemples avec sous-tâches / Examples with subtasks

```
Créer une sous-tâche sous la tâche xyz789 pour gab@example.com :
- Nom: "Rédiger les tests unitaires"
- Complexité: 2
```

## Natural Language Examples (English)

Claude Code understands natural language, so you can be conversational:

```
"Create a task for user gab@example.com with the name 'Call the dentist'"
```

```
"List all uncompleted tasks for gab@example.com"
```

```
"Show me tasks planned for today for user gab@example.com"
```

```
"Create a high-priority task for gab@example.com:
- Name: Review Q4 financial report
- Importance: 80
- Complexity: 3
- Planned date: 2025-10-20"
```

## Troubleshooting

### Server not appearing in Claude Code?

**1. Verify the server is configured:**
```bash
claude mcp list
```
You should see `gtd-task-manager` in the output with status "Connected".

**2. Check the configuration file directly:**
```bash
cat ~/.config/Claude/claude_desktop_config.json
```
Ensure `gtd-task-manager` appears in the `mcpServers` section.

**3. Verify the build exists:**
```bash
ls -la /home/gab/apps/2507-gtd/mcp-server/build/index.js
```

**4. Test the server manually:**
```bash
DATABASE_URL="file:/home/gab/apps/2507-gtd/backend/prisma/dev.db" \
  node /home/gab/apps/2507-gtd/mcp-server/build/index.js
```
You should see: "GTD MCP Server is running..."

**5. Restart Claude Code completely:**
- Close all Claude Code instances (in VSCode and terminal)
- Wait 5 seconds
- Reopen Claude Code in your project
- Try `/mcp` command to see available servers

**6. Check for connection errors:**
```bash
# Run Claude Code with debug logging
CLAUDE_LOG_LEVEL=debug claude
```

**7. Reset and re-add the server:**
```bash
# Remove old configuration
claude mcp remove gtd-task-manager

# Re-add with correct paths
claude mcp add --transport stdio gtd-task-manager \
  --env DATABASE_URL="file:/home/gab/apps/2507-gtd/backend/prisma/dev.db" \
  -- node /home/gab/apps/2507-gtd/mcp-server/build/index.js

# Verify
claude mcp get gtd-task-manager
```

### Tasks not appearing in the app?
- Verify you're using the correct user ID
- Check that the database path is correct in the config
- Ensure the backend is using the same database file

### Permission errors?
- Make sure the database file has write permissions
- Check that the user exists in the database

### Claude Code not detecting the server after restart?
- **VSCode Extension**: Make sure you're restarting the Claude Code extension in VSCode, not just the editor
  - In VSCode: `Cmd/Ctrl + Shift + P` → "Developer: Reload Window"
- **CLI**: Make sure you're running `claude` from the terminal after updating the config
- The config file path is: `~/.config/Claude/claude_desktop_config.json` (NOT `~/.claude/settings.json`)

## Advanced: Multiple Environments

You can set up different MCP server configurations for dev/production:

```json
{
  "mcpServers": {
    "gtd-dev": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "DATABASE_URL": "file:/path/to/dev.db"
      }
    },
    "gtd-prod": {
      "command": "node",
      "args": ["/path/to/mcp-server/build/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/gtd"
      }
    }
  }
}
```

## Security Note

The MCP server has direct database access. Only use it with trusted AI assistants and ensure your user ID remains private.
