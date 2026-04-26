import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ApiClient } from '../client/ApiClient.js'
import { TaskDto } from '../client/types.js'

function formatTask(task: TaskDto): string {
  const lines = [
    `**${task.name}**`,
    `  ID: ${task.id}`,
    `  Importance: ${task.importance} | Complexity: ${task.complexity} | Points: ${task.points}`,
    `  Status: ${task.isCompleted ? 'completed' : task.status}`,
  ]
  if (task.plannedDate) lines.push(`  Planned: ${task.plannedDate.split('T')[0]}`)
  if (task.dueDate) lines.push(`  Due: ${task.dueDate.split('T')[0]}`)
  if (task.link) lines.push(`  Link: ${task.link}`)
  if (task.tags.length > 0) lines.push(`  Tags: ${task.tags.map((t) => t.name).join(', ')}`)
  if (task.subtasks && task.subtasks.length > 0) lines.push(`  Subtasks: ${task.subtasks.length}`)
  return lines.join('\n')
}

export function registerTaskTools(server: McpServer, getClient: () => ApiClient): void {
  server.tool(
    'list-tasks',
    'List tasks. Filter by completion status, search by keyword, or limit results.',
    {
      isCompleted: z.boolean().optional().describe('true = completed, false = active (default: active)'),
      search: z.string().optional().describe('Search tasks by name'),
      parentId: z.string().optional().describe('Filter to subtasks of a specific parent task'),
      limit: z.number().min(1).max(200).optional().default(50).describe('Max tasks to return'),
    },
    async ({ isCompleted, search, parentId, limit }) => {
      try {
        const tasks = await getClient().listTasks({ isCompleted, search, parentId, limit })
        if (tasks.length === 0) return { content: [{ type: 'text', text: 'No tasks found.' }] }
        const text = `Found ${tasks.length} task(s):\n\n` + tasks.map(formatTask).join('\n\n')
        return { content: [{ type: 'text', text }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'get-task',
    'Get a single task by name or ID.',
    {
      taskName: z.string().optional().describe('Task name (case-insensitive search)'),
      taskId: z.string().optional().describe('Exact task ID (takes priority over taskName)'),
    },
    async ({ taskName, taskId }) => {
      try {
        const id = await getClient().resolveTaskId(taskId, taskName)
        const task = await getClient().getTask(id)
        return { content: [{ type: 'text', text: formatTask(task) }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'create-task',
    'Create a new task.',
    {
      name: z.string().min(1).describe('Task name/title'),
      importance: z.number().min(0).max(50).optional().default(10).describe('Importance 0–50 (default: 10)'),
      complexity: z.number().min(1).max(9).optional().default(1).describe('Complexity 1–9 (default: 1)'),
      link: z.string().url().optional().describe('URL associated with the task'),
      note: z.string().optional().describe('Notes (plain text or markdown)'),
      plannedDate: z.string().optional().describe('Planned date YYYY-MM-DD'),
      dueDate: z.string().optional().describe('Due date YYYY-MM-DD'),
      parentTaskName: z.string().optional().describe('Parent task name (to create a subtask)'),
      parentTaskId: z.string().optional().describe('Parent task ID (takes priority over parentTaskName)'),
      tagNames: z.array(z.string()).optional().describe('Tag names to attach (e.g. ["work", "urgent"])'),
      tagIds: z.array(z.string()).optional().describe('Tag IDs to attach (fallback)'),
    },
    async ({ name, importance, complexity, link, note, plannedDate, dueDate, parentTaskName, parentTaskId, tagNames, tagIds }) => {
      try {
        const client = getClient()
        let parentId: string | undefined
        if (parentTaskId || parentTaskName) {
          parentId = await client.resolveTaskId(parentTaskId, parentTaskName)
        }
        const resolvedTagIds = await client.resolveTagIds(tagNames, tagIds)

        const task = await client.createTask({
          name, importance, complexity, link, note, plannedDate, dueDate,
          parentId,
          tagIds: resolvedTagIds.length > 0 ? resolvedTagIds : undefined,
        })
        return { content: [{ type: 'text', text: `Task created!\n\n${formatTask(task)}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'update-task',
    'Update an existing task by name or ID.',
    {
      taskName: z.string().optional().describe('Task name (case-insensitive search)'),
      taskId: z.string().optional().describe('Exact task ID (takes priority over taskName)'),
      name: z.string().optional().describe('New task name'),
      importance: z.number().min(0).max(50).optional().describe('New importance 0–50'),
      complexity: z.number().min(1).max(9).optional().describe('New complexity 1–9'),
      link: z.string().url().nullable().optional().describe('New link (null to remove)'),
      note: z.string().nullable().optional().describe('New notes (null to remove)'),
      plannedDate: z.string().nullable().optional().describe('New planned date YYYY-MM-DD (null to remove)'),
      dueDate: z.string().nullable().optional().describe('New due date YYYY-MM-DD (null to remove)'),
      tagNames: z.array(z.string()).optional().describe('Replace tags by name'),
      tagIds: z.array(z.string()).optional().describe('Replace tags by ID'),
    },
    async ({ taskName, taskId, name, importance, complexity, link, note, plannedDate, dueDate, tagNames, tagIds }) => {
      try {
        const client = getClient()
        const id = await client.resolveTaskId(taskId, taskName)
        const resolvedTagIds = (tagNames || tagIds) ? await client.resolveTagIds(tagNames, tagIds) : undefined

        const task = await client.updateTask(id, {
          name, importance, complexity,
          link: link as string | null | undefined,
          note: note as string | null | undefined,
          plannedDate: plannedDate as string | null | undefined,
          dueDate: dueDate as string | null | undefined,
          tagIds: resolvedTagIds,
        })
        return { content: [{ type: 'text', text: `Task updated!\n\n${formatTask(task)}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'delete-task',
    'Delete a task by name or ID.',
    {
      taskName: z.string().optional().describe('Task name (case-insensitive search)'),
      taskId: z.string().optional().describe('Exact task ID (takes priority over taskName)'),
    },
    async ({ taskName, taskId }) => {
      try {
        const id = await getClient().resolveTaskId(taskId, taskName)
        await getClient().deleteTask(id)
        return { content: [{ type: 'text', text: 'Task deleted.' }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )

  server.tool(
    'complete-task',
    'Mark a task as completed by name or ID.',
    {
      taskName: z.string().optional().describe('Task name (case-insensitive search)'),
      taskId: z.string().optional().describe('Exact task ID (takes priority over taskName)'),
    },
    async ({ taskName, taskId }) => {
      try {
        const id = await getClient().resolveTaskId(taskId, taskName)
        const task = await getClient().completeTask(id)
        return { content: [{ type: 'text', text: `Task marked as completed!\n\n${formatTask(task)}` }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true }
      }
    }
  )
}
