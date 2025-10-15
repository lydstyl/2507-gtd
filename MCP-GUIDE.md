# GTD MCP Server - Quick Start Guide

## What is this?

The GTD MCP Server allows Claude Code (and other MCP-compatible AI assistants) to create tasks directly in your GTD system using the `create-task-for-user` tool.

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
