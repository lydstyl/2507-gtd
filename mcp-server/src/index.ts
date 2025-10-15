#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseConfig } from './config/database.js';
import { TaskCreator, CreateTaskSchema } from './tools/createTask.js';
import { TaskLister, ListTasksSchema } from './tools/listTasks.js';

const prisma = DatabaseConfig.getInstance();
const taskCreator = new TaskCreator(prisma);
const taskLister = new TaskLister(prisma);

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
        description: 'Create a new task for a specific user in the GTD system. You can use either userId or userEmail.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The ID of the user (either userId or userEmail must be provided)'
            },
            userEmail: {
              type: 'string',
              description: 'The email of the user (either userId or userEmail must be provided)'
            },
            name: {
              type: 'string',
              description: 'The name/title of the task'
            },
            importance: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Importance level (1-100, default: 50, higher = more important)',
              default: 50
            },
            complexity: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Complexity level (1-5, default: 1, higher = more complex)',
              default: 1
            },
            link: {
              type: 'string',
              description: 'Optional link associated with the task'
            },
            note: {
              type: 'string',
              description: 'Optional rich text note for the task'
            },
            plannedDate: {
              type: 'string',
              description: 'Optional planned date in ISO format (YYYY-MM-DD)'
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
          required: ['name']
        }
      },
      {
        name: 'list-tasks-for-user',
        description: 'List tasks for a specific user. You can filter by completion status, planned date, or due date. You can use either userId or userEmail.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The ID of the user (either userId or userEmail must be provided)'
            },
            userEmail: {
              type: 'string',
              description: 'The email of the user (either userId or userEmail must be provided)'
            },
            isCompleted: {
              type: 'boolean',
              description: 'Filter by completion status (true = completed, false = not completed)'
            },
            plannedDate: {
              type: 'string',
              description: 'Filter by planned date in ISO format (YYYY-MM-DD)'
            },
            dueDate: {
              type: 'string',
              description: 'Filter by due date in ISO format (YYYY-MM-DD)'
            },
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Maximum number of tasks to return (default: 50)',
              default: 50
            }
          },
          required: []
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
            text: `✅ Task created successfully!\n\n**Task Details:**\n- ID: ${task.id}\n- Name: ${task.name}\n- Importance: ${task.importance}\n- Complexity: ${task.complexity}\n- Points: ${task.points}\n- Created: ${task.createdAt.toISOString()}\n- User ID: ${task.userId}${task.parentId ? `\n- Parent Task ID: ${task.parentId}` : ''}${task.dueDate ? `\n- Due Date: ${task.dueDate}` : ''}${task.link ? `\n- Link: ${task.link}` : ''}${task.tags.length > 0 ? `\n- Tags: ${task.tags.map(tag => tag.name).join(', ')}` : ''}`
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

  if (name === 'list-tasks-for-user') {
    try {
      // Validate input using Zod schema
      const validatedInput = ListTasksSchema.parse(args);

      // List the tasks
      const tasks = await taskLister.listTasks(validatedInput);

      if (tasks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📋 No tasks found matching the criteria.'
            }
          ]
        };
      }

      const tasksList = tasks.map((task, index) => {
        const taskInfo = [
          `${index + 1}. **${task.name}**`,
          `   - ID: ${task.id}`,
          `   - Importance: ${task.importance} | Complexity: ${task.complexity} | Points: ${task.points}`
        ];

        if (task.plannedDate) {
          taskInfo.push(`   - Planned: ${new Date(task.plannedDate).toISOString().split('T')[0]}`);
        }

        if (task.dueDate) {
          taskInfo.push(`   - Due: ${new Date(task.dueDate).toISOString().split('T')[0]}`);
        }

        if (task.link) {
          taskInfo.push(`   - Link: ${task.link}`);
        }

        if (task.tags && task.tags.length > 0) {
          taskInfo.push(`   - Tags: ${task.tags.map(tag => tag.name).join(', ')}`);
        }

        if (task.subtasks && task.subtasks.length > 0) {
          taskInfo.push(`   - Subtasks: ${task.subtasks.length}`);
        }

        return taskInfo.join('\n');
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `✅ Found ${tasks.length} task(s):\n\n${tasksList}`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text',
            text: `❌ Error listing tasks: ${errorMessage}`
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