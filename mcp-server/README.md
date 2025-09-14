# GTD MCP Server

A Model Context Protocol (MCP) server that provides task creation functionality for the GTD (Getting Things Done) application.

## Features

- **create-task-for-user**: Create tasks for specific users in the GTD system
- Full integration with existing GTD backend architecture
- Type-safe validation using Zod schemas
- Graceful error handling and user feedback

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

## Usage

### Running the Server

The server can be run directly for testing:
```bash
npm run dev
```

Or use the built version:
```bash
./build/index.js
```

### Tool: create-task-for-user

Creates a new task for a specific user in the GTD system.

**Parameters:**
- `userId` (required): The ID of the user to create the task for
- `name` (required): The name/title of the task
- `importance` (optional): Importance level 1-9 (1 being most important, default: 5)
- `urgency` (optional): Urgency level 1-9 (default: 5)
- `priority` (optional): Priority level 1-9 (default: 5)
- `link` (optional): Link associated with the task
- `note` (optional): Rich text note for the task
- `dueDate` (optional): Due date in ISO format (YYYY-MM-DD)
- `parentId` (optional): ID of parent task (for creating subtasks)
- `tagIds` (optional): Array of tag IDs to associate with the task

**Example:**
```json
{
  "userId": "user123",
  "name": "Complete project documentation",
  "importance": 3,
  "urgency": 2,
  "dueDate": "2025-01-15",
  "note": "Include all API endpoints and examples"
}
```

## Integration with Claude Desktop

To use this MCP server with Claude Desktop, add it to your MCP configuration:

```json
{
  "mcpServers": {
    "gtd-task-manager": {
      "command": "/path/to/gtd-mcp-server/build/index.js"
    }
  }
}
```

## Development

- `npm run dev`: Run with ts-node for development
- `npm run build`: Build TypeScript to JavaScript
- `npm run watch`: Watch for changes and rebuild
- `npm run inspector`: Use MCP Inspector for testing

## Database Configuration

The server connects to the same database as the main GTD application. Ensure the database URL is properly configured:

- Default: `file:../backend/prisma/dev.db`
- Override with `DATABASE_URL` environment variable

## Architecture

This MCP server leverages the existing GTD application architecture:
- Uses the same Prisma database client
- Implements the same validation and business logic
- Maintains user isolation and security patterns
- Provides comprehensive error handling

## Security

- All operations are user-scoped (userId is required)
- Input validation using Zod schemas
- Parent task ownership validation
- Tag ownership validation
- Graceful error handling without exposing sensitive information