#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseConfig } from './config/database.js';
import { TaskCreator, CreateTaskSchema } from './tools/createTask.js';

const prisma = DatabaseConfig.getInstance();
const taskCreator = new TaskCreator(prisma);

const server = new Server(
  {
    name: 'gtd-task-manager',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Set up tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create-task-for-user',
        description: 'Create a new task for a specific user in the GTD system',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The ID of the user to create the task for'
            },
            name: {
              type: 'string',
              description: 'The name/title of the task'
            },
            importance: {
              type: 'number',
              minimum: 1,
              maximum: 9,
              description: 'Importance level (1-9, 1 being most important)',
              default: 5
            },
            urgency: {
              type: 'number',
              minimum: 1,
              maximum: 9,
              description: 'Urgency level (1-9)',
              default: 5
            },
            priority: {
              type: 'number',
              minimum: 1,
              maximum: 9,
              description: 'Priority level (1-9)',
              default: 5
            },
            link: {
              type: 'string',
              description: 'Optional link associated with the task'
            },
            note: {
              type: 'string',
              description: 'Optional rich text note for the task'
            },
            dueDate: {
              type: 'string',
              description: 'Optional due date in ISO format (YYYY-MM-DD)'
            },
            parentId: {
              type: 'string',
              description: 'Optional ID of parent task (for creating subtasks)'
            },
            tagIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Optional array of tag IDs to associate with the task'
            }
          },
          required: ['userId', 'name']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'create-task-for-user') {
    try {
      // Validate input using Zod schema
      const validatedInput = CreateTaskSchema.parse(args);
      
      // Create the task
      const task = await taskCreator.createTask(validatedInput);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Task created successfully!\n\n**Task Details:**\n- ID: ${task.id}\n- Name: ${task.name}\n- Importance: ${task.importance}\n- Urgency: ${task.urgency}\n- Priority: ${task.priority}\n- Created: ${task.createdAt.toISOString()}\n- User ID: ${task.userId}${task.parentId ? `\n- Parent Task ID: ${task.parentId}` : ''}${task.dueDate ? `\n- Due Date: ${task.dueDate}` : ''}${task.link ? `\n- Link: ${task.link}` : ''}${task.tags.length > 0 ? `\n- Tags: ${task.tags.map(tag => tag.name).join(', ')}` : ''}`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error creating task: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...');
  await DatabaseConfig.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  await DatabaseConfig.disconnect();
  process.exit(0);
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('GTD MCP Server is running...');
  } catch (error) {
    console.error('Failed to start server:', error);
    await DatabaseConfig.disconnect();
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('Unhandled error:', error);
  await DatabaseConfig.disconnect();
  process.exit(1);
});