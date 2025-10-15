# GTD MCP Server - Quick Start Guide

## What is this?

The GTD MCP Server allows Claude Code (and other MCP-compatible AI assistants) to create tasks directly in your GTD system using the `create-task-for-user` tool.

## Setup Instructions

### 1. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure Claude Code

Add this configuration to your Claude Code MCP settings file:

**Location**: `~/.config/Claude/claude_desktop_config.json` (Linux/Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "gtd-task-manager": {
      "command": "node",
      "args": ["/home/gab/apps/2507-gtd/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "file:/home/gab/apps/2507-gtd/backend/prisma/dev.db"
      }
    }
  }
}
```

**Important**: Update the paths to match your actual installation directory.

### 3. Restart Claude Code

Close and reopen Claude Code for the configuration to take effect.

### 4. Verify Connection

In Claude Code, you should see the `gtd-task-manager` server listed in the MCP section. The server provides one tool: `create-task-for-user`.

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

## Tool Parameters Reference

### Required Parameters
- `userId` (string) - Your GTD user ID
- `name` (string) - Task name/title

### Optional Parameters
- `importance` (number 1-9) - How important (1 = most important, default: 5)
- `urgency` (number 1-9) - How urgent (default: 5)
- `priority` (number 1-9) - Overall priority (default: 5)
- `dueDate` (string) - Due date in ISO format (YYYY-MM-DD)
- `link` (string) - Associated URL
- `note` (string) - Rich text notes
- `parentId` (string) - Parent task ID for creating subtasks
- `tagIds` (array of strings) - Tag IDs to associate with task

## Natural Language Examples

Claude Code understands natural language, so you can be conversational:

```
"I need to create a reminder to call the dentist tomorrow. Make it for user clzr52iyk0000ufw2qj88kfgq"

"Add a high-priority task to review the security audit findings for user clzr52iyk0000ufw2qj88kfgq"

"Create a subtask under task xyz789 to update the documentation"
```

## Troubleshooting

**Server not appearing in Claude Code?**
- Check that paths in config are absolute and correct
- Verify the MCP server builds successfully (`npm run build`)
- Check Claude Code logs for connection errors

**Tasks not appearing in the app?**
- Verify you're using the correct user ID
- Check that the database path is correct in the config
- Ensure the backend is using the same database file

**Permission errors?**
- Make sure the database file has write permissions
- Check that the user exists in the database

## Advanced: Multiple Environments

You can set up different MCP server configurations for dev/production:

```json
{
  "mcpServers": {
    "gtd-dev": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "file:/path/to/dev.db"
      }
    },
    "gtd-prod": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/gtd"
      }
    }
  }
}
```

## Security Note

The MCP server has direct database access. Only use it with trusted AI assistants and ensure your user ID remains private.
