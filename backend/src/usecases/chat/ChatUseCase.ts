import { LanguageModel, streamText, tool } from 'ai'
import { z } from 'zod'
import { CreateTaskUseCase } from '../tasks/CreateTaskUseCase'
import { GetAllTasksUseCase } from '../tasks/GetAllTasksUseCase'
import { UpdateTaskUseCase } from '../tasks/UpdateTaskUseCase'
import { DeleteTaskUseCase } from '../tasks/DeleteTaskUseCase'
import { MarkTaskAsCompletedUseCase } from '../tasks/MarkTaskAsCompletedUseCase'
import { CreateTagUseCase } from '../tags/CreateTagUseCase'
import { GetAllTagsUseCase } from '../tags/GetAllTagsUseCase'
import { UpdateTagUseCase } from '../tags/UpdateTagUseCase'
import { DeleteTagUseCase } from '../tags/DeleteTagUseCase'
import { TaskFilters } from '../../domain/entities/Task'
import { chatLogger } from '../../infrastructure/logger/Logger'

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userId: string
}

export class ChatUseCase {
  constructor(
    private model: LanguageModel,
    private createTaskUseCase: CreateTaskUseCase,
    private getAllTasksUseCase: GetAllTasksUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase,
    private markTaskAsCompletedUseCase: MarkTaskAsCompletedUseCase,
    private createTagUseCase: CreateTagUseCase,
    private getAllTagsUseCase: GetAllTagsUseCase,
    private updateTagUseCase: UpdateTagUseCase,
    private deleteTagUseCase: DeleteTagUseCase
  ) {}

  // Helper to safely convert date to ISO string
  private toIsoDate(date: Date | string | undefined | null): string | undefined {
    if (!date) return undefined
    if (date instanceof Date) return date.toISOString().split('T')[0]
    if (typeof date === 'string') return date.split('T')[0]
    return undefined
  }

  execute(request: ChatRequest) {
    const { messages, userId } = request

    chatLogger.info('ChatUseCase.execute called', {
      userId,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100)
    })

    const result = streamText({
      model: this.model,
      system: `You are a helpful task management assistant for a GTD (Getting Things Done) application.
You can help users manage tasks and tags with full CRUD operations.

TASK MANAGEMENT:
- Create tasks with name, importance (0-50), complexity (1-9), dates, links, notes, and tags
- List and filter tasks by various criteria
- Update any task property
- Mark tasks as completed
- Delete tasks
- Default importance is 0 for collected tasks that need categorization

IMPORTANCE SCALE (0-50):
- 0 = Uncategorized/collected (needs review)
- 1-10 = Low importance
- 11-25 = Medium importance
- 26-40 = High importance
- 41-50 = Maximum/Critical importance
- When user says "maximum importance" or "highest priority", use 50
- When user says "high importance", use 35-40
- When user says "medium importance", use 20-25
- When user says "low importance", use 5-10

COMPLEXITY SCALE (1-9):
- 1-3 = Simple/Easy tasks
- 4-6 = Medium complexity
- 7-9 = Complex/Difficult tasks
- When user says "maximum complexity" or "very complex", use 9
- When user says "high complexity", use 7-8
- When user says "medium complexity", use 5-6
- When user says "low complexity" or "simple", use 2-3

TAG MANAGEMENT:
- Create tags with name and color
- List all user tags
- Update tag name or color
- Delete tags (removes them from all tasks)

When parsing dates:
- Parse naturally (e.g., "tomorrow", "next week", "Monday", "2024-12-25")
- plannedDate = when to start the task
- dueDate = deadline for the task

When creating tasks:
- Extract task details from natural language
- Suggest appropriate importance and complexity based on context
- Can attach multiple tags using tag IDs or names

Be concise, helpful, and action-oriented.`,
      messages,
      tools: {
        createTask: tool({
          description: 'Create a new task in the GTD system. Use this when the user wants to add a task, create a todo, or remember something. Can include links, notes, tags, and dates.',
          inputSchema: z.object({
            name: z.string().describe('The task name or description'),
            importance: z.number().min(0).max(50).optional().describe('Task importance (0-50), where 0 means uncategorized/collected, 1-10 is low, 11-25 is medium, 26-40 is high, 41-50 is maximum/critical. Default is 0'),
            complexity: z.number().min(1).max(9).optional().describe('Task complexity (1-9), where 1-3 is simple, 4-6 is medium, 7-9 is complex/difficult. Default is 3'),
            plannedDate: z.string().optional().describe('When to do the task (ISO date string: YYYY-MM-DD)'),
            dueDate: z.string().optional().describe('Task deadline (ISO date string: YYYY-MM-DD)'),
            link: z.string().optional().describe('A URL link related to the task'),
            note: z.string().optional().describe('Additional notes or details about the task'),
            tagIds: z.array(z.string()).optional().describe('Array of tag IDs to associate with the task'),
          }),
          execute: async ({ name, importance, complexity, plannedDate, dueDate, link, note, tagIds }) => {
            try {
              chatLogger.info('createTask tool called', {
                name, importance, complexity, plannedDate, dueDate, link, tagIds, userId
              })

              const result = await this.createTaskUseCase.execute({
                name,
                userId,
                importance: importance ?? 0,
                complexity: complexity ?? 3,
                plannedDate: plannedDate ? new Date(plannedDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                link,
                note,
                tagIds
              })

              if (result.success) {
                chatLogger.info('createTask tool succeeded', {
                  taskId: result.data!.id,
                  taskName: result.data!.name
                })

                return {
                  success: true,
                  task: {
                    id: result.data!.id,
                    name: result.data!.name,
                    importance: result.data!.importance,
                    complexity: result.data!.complexity,
                    plannedDate: this.toIsoDate(result.data!.plannedDate),
                    dueDate: this.toIsoDate(result.data!.dueDate),
                    link: result.data!.link,
                    isCompleted: result.data!.isCompleted,
                    tags: result.data!.tags?.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
                  }
                }
              } else {
                chatLogger.error('createTask tool failed', result.error)
                return {
                  success: false,
                  error: result.error
                }
              }
            } catch (error) {
              chatLogger.error('createTask tool exception', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
              })
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create task'
              }
            }
          }
        }),

        listTasks: tool({
          description: 'List and filter tasks from the GTD system. Use this when the user wants to see their tasks, check what needs to be done, or query their task list. Only shows active (not completed) tasks by default.',
          inputSchema: z.object({
            importance: z.number().min(0).max(50).optional().describe('Filter by importance (0-50)'),
            complexity: z.number().min(1).max(9).optional().describe('Filter by complexity (1-9)'),
            search: z.string().optional().describe('Search tasks by name'),
            limit: z.number().optional().describe('Maximum number of tasks to return, default is 20'),
          }),
          execute: async ({ importance, complexity, search, limit = 20 }) => {
            try {
              chatLogger.info('listTasks tool called', {
                importance, complexity, search, limit, userId
              })

              // Build filters object only with defined values
              const filters: Partial<TaskFilters> = {}
              if (importance !== undefined) filters.importance = importance
              if (complexity !== undefined) filters.complexity = complexity
              if (search !== undefined) filters.search = search

              chatLogger.debug('listTasks fetching with filters', filters)

              const tasks = await this.getAllTasksUseCase.executeRootTasks(
                userId,
                Object.keys(filters).length > 0 ? filters as TaskFilters : undefined
              )

              chatLogger.info('listTasks fetched tasks', {
                totalTasks: tasks.length,
                willReturnCount: Math.min(tasks.length, limit)
              })

              // Limit results
              const limitedTasks = tasks.slice(0, limit)

              return {
                success: true,
                count: limitedTasks.length,
                total: tasks.length,
                tasks: limitedTasks.map(task => ({
                  id: task.id,
                  name: task.name,
                  importance: task.importance,
                  complexity: task.complexity,
                  isCompleted: task.isCompleted,
                  plannedDate: this.toIsoDate(task.plannedDate),
                  dueDate: this.toIsoDate(task.dueDate),
                  link: task.link,
                  subtaskCount: task.subtasks?.length || 0,
                  tags: task.tags?.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
                }))
              }
            } catch (error) {
              chatLogger.error('listTasks tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list tasks'
              }
            }
          }
        }),

        updateTask: tool({
          description: 'Update an existing task. Use this when the user wants to modify a task, change its properties, or edit task details. Can update name, importance, complexity, dates, link, note, or tags.',
          inputSchema: z.object({
            taskId: z.string().describe('The ID of the task to update'),
            name: z.string().optional().describe('New task name'),
            importance: z.number().min(0).max(50).optional().describe('New importance (0-50)'),
            complexity: z.number().min(1).max(9).optional().describe('New complexity (1-9)'),
            plannedDate: z.string().optional().nullable().describe('New planned date (ISO: YYYY-MM-DD) or null to remove'),
            dueDate: z.string().optional().nullable().describe('New due date (ISO: YYYY-MM-DD) or null to remove'),
            link: z.string().optional().nullable().describe('New link or null to remove'),
            note: z.string().optional().nullable().describe('New note or null to remove'),
            tagIds: z.array(z.string()).optional().describe('New array of tag IDs to replace existing tags'),
          }),
          execute: async ({ taskId, name, importance, complexity, plannedDate, dueDate, link, note, tagIds }) => {
            try {
              chatLogger.info('updateTask tool called', {
                taskId, name, importance, complexity, plannedDate, dueDate, link, userId
              })

              const updateData: any = { userId }
              if (name !== undefined) updateData.name = name
              if (importance !== undefined) updateData.importance = importance
              if (complexity !== undefined) updateData.complexity = complexity
              if (plannedDate !== undefined) updateData.plannedDate = plannedDate ? new Date(plannedDate) : null
              if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
              if (link !== undefined) updateData.link = link
              if (note !== undefined) updateData.note = note
              if (tagIds !== undefined) updateData.tagIds = tagIds

              const result = await this.updateTaskUseCase.execute(taskId, updateData)

              if (result.success) {
                return {
                  success: true,
                  task: {
                    id: result.data!.id,
                    name: result.data!.name,
                    importance: result.data!.importance,
                    complexity: result.data!.complexity,
                    plannedDate: this.toIsoDate(result.data!.plannedDate),
                    dueDate: this.toIsoDate(result.data!.dueDate),
                    link: result.data!.link,
                    isCompleted: result.data!.isCompleted,
                    tags: result.data!.tags?.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
                  }
                }
              } else {
                return {
                  success: false,
                  error: result.error
                }
              }
            } catch (error) {
              chatLogger.error('updateTask tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update task'
              }
            }
          }
        }),

        markTaskCompleted: tool({
          description: 'Mark a task as completed. Use this when the user says they finished, completed, or are done with a task.',
          inputSchema: z.object({
            taskId: z.string().describe('The ID of the task to mark as completed'),
          }),
          execute: async ({ taskId }) => {
            try {
              chatLogger.info('markTaskCompleted tool called', {
                taskId, userId
              })

              const task = await this.markTaskAsCompletedUseCase.execute(taskId, userId)

              return {
                success: true,
                task: {
                  id: task.id,
                  name: task.name,
                  isCompleted: task.isCompleted,
                  completedAt: task.completedAt ? task.completedAt.toISOString() : null
                }
              }
            } catch (error) {
              chatLogger.error('markTaskCompleted tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to mark task as completed'
              }
            }
          }
        }),

        deleteTask: tool({
          description: 'Delete a task permanently. Use this when the user wants to remove or delete a task. This action cannot be undone.',
          inputSchema: z.object({
            taskId: z.string().describe('The ID of the task to delete'),
          }),
          execute: async ({ taskId }) => {
            try {
              chatLogger.info('deleteTask tool called', {
                taskId, userId
              })

              await this.deleteTaskUseCase.execute(taskId, userId)

              return {
                success: true,
                message: 'Task deleted successfully',
                taskId
              }
            } catch (error) {
              chatLogger.error('deleteTask tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete task'
              }
            }
          }
        }),

        createTag: tool({
          description: 'Create a new tag for organizing tasks. Use this when the user wants to create a label, category, or tag.',
          inputSchema: z.object({
            name: z.string().describe('The tag name (e.g., "work", "personal", "urgent")'),
            color: z.string().optional().describe('Hex color code for the tag (e.g., "#3B82F6"). Default is "#6366F1"'),
          }),
          execute: async ({ name, color }) => {
            try {
              chatLogger.info('createTag tool called', {
                name, color, userId
              })

              const result = await this.createTagUseCase.execute({
                name,
                color: color || '#6366F1',
                userId
              })

              if (result.success) {
                return {
                  success: true,
                  tag: {
                    id: result.data!.id,
                    name: result.data!.name,
                    color: result.data!.color
                  }
                }
              } else {
                return {
                  success: false,
                  error: result.error
                }
              }
            } catch (error) {
              chatLogger.error('createTag tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create tag'
              }
            }
          }
        }),

        listTags: tool({
          description: 'List all tags created by the user. Use this when the user wants to see their tags, labels, or categories.',
          inputSchema: z.object({}),
          execute: async () => {
            try {
              chatLogger.info('listTags tool called', { userId })

              const tags = await this.getAllTagsUseCase.execute(userId)

              return {
                success: true,
                count: tags.length,
                tags: tags.map(tag => ({
                  id: tag.id,
                  name: tag.name,
                  color: tag.color
                }))
              }
            } catch (error) {
              chatLogger.error('listTags tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list tags'
              }
            }
          }
        }),

        updateTag: tool({
          description: 'Update an existing tag. Use this when the user wants to rename a tag or change its color.',
          inputSchema: z.object({
            tagId: z.string().describe('The ID of the tag to update'),
            name: z.string().optional().describe('New tag name'),
            color: z.string().optional().describe('New hex color code (e.g., "#3B82F6")'),
          }),
          execute: async ({ tagId, name, color }) => {
            try {
              chatLogger.info('updateTag tool called', {
                tagId, name, color, userId
              })

              const updateData: any = {}
              if (name !== undefined) updateData.name = name
              if (color !== undefined) updateData.color = color

              const tag = await this.updateTagUseCase.execute(tagId, updateData, userId)

              return {
                success: true,
                tag: {
                  id: tag.id,
                  name: tag.name,
                  color: tag.color
                }
              }
            } catch (error) {
              chatLogger.error('updateTag tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update tag'
              }
            }
          }
        }),

        deleteTag: tool({
          description: 'Delete a tag permanently. This will remove the tag from all tasks that use it. Use this when the user wants to remove or delete a tag.',
          inputSchema: z.object({
            tagId: z.string().describe('The ID of the tag to delete'),
          }),
          execute: async ({ tagId }) => {
            try {
              chatLogger.info('deleteTag tool called', {
                tagId, userId
              })

              await this.deleteTagUseCase.execute(tagId, userId)

              return {
                success: true,
                message: 'Tag deleted successfully',
                tagId
              }
            } catch (error) {
              chatLogger.error('deleteTag tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete tag'
              }
            }
          }
        })
      }
    })

    return result
  }
}
