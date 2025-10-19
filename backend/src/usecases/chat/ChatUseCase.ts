import { LanguageModel, streamText, tool } from 'ai'
import { z } from 'zod'
import { CreateTaskUseCase } from '../tasks/CreateTaskUseCase'
import { GetAllTasksUseCase } from '../tasks/GetAllTasksUseCase'
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
    private getAllTasksUseCase: GetAllTasksUseCase
  ) {}

  async execute(request: ChatRequest) {
    const { messages, userId } = request

    chatLogger.info('ChatUseCase.execute called', {
      userId,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100)
    })

    const result = streamText({
      model: this.model,
      system: `You are a helpful task management assistant for a GTD (Getting Things Done) application.
You can help users create tasks, list their tasks, and manage their workflow.

When creating tasks:
- Extract the task name from user input
- Parse dates naturally (e.g., "tomorrow", "next week", "Monday")
- Set appropriate importance (1-5) and complexity (1-9) based on context
- Default importance is 0 for collected tasks that need categorization

When listing tasks:
- You can filter by completion status, planned date, or due date
- Always show the most relevant tasks first
- Present tasks in a clear, organized manner

Be concise, helpful, and action-oriented.`,
      messages,
      tools: {
        createTask: tool({
          description: 'Create a new task in the GTD system. Use this when the user wants to add a task, create a todo, or remember something.',
          inputSchema: z.object({
            name: z.string().describe('The task name or description'),
            importance: z.number().min(0).max(5).optional().describe('Task importance (0-5), where 0 means uncategorized/collected, default is 0'),
            complexity: z.number().min(1).max(9).optional().describe('Task complexity (1-9), default is 3'),
            plannedDate: z.string().optional().describe('When to do the task (ISO date string: YYYY-MM-DD)'),
            dueDate: z.string().optional().describe('Task deadline (ISO date string: YYYY-MM-DD)'),
            note: z.string().optional().describe('Additional notes or details about the task'),
          }),
          execute: async ({ name, importance, complexity, plannedDate, dueDate, note }) => {
            try {
              chatLogger.info('createTask tool called', {
                name, importance, complexity, plannedDate, dueDate, userId
              })

              const result = await this.createTaskUseCase.execute({
                name,
                userId,
                importance: importance ?? 0,
                complexity: complexity ?? 3,
                plannedDate: plannedDate ? new Date(plannedDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                note
              })

              if (result.success) {
                chatLogger.info('createTask tool succeeded', {
                  taskId: result.data!.id,
                  taskName: result.data!.name
                })
                const toolResult = {
                  success: true,
                  task: {
                    id: result.data!.id,
                    name: result.data!.name,
                    importance: result.data!.importance,
                    complexity: result.data!.complexity,
                    plannedDate: result.data!.plannedDate?.toISOString().split('T')[0],
                    dueDate: result.data!.dueDate?.toISOString().split('T')[0],
                  }
                }
                chatLogger.debug('createTask tool result', toolResult)
                return toolResult
              } else {
                chatLogger.error('createTask tool failed', result.error)
                return {
                  success: false,
                  error: result.error
                }
              }
            } catch (error) {
              chatLogger.error('createTask tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create task'
              }
            }
          }
        }),

        listTasks: tool({
          description: 'List and filter tasks from the GTD system. Use this when the user wants to see their tasks, check what needs to be done, or query their task list. Only shows active (not completed) tasks.',
          inputSchema: z.object({
            importance: z.number().min(0).max(5).optional().describe('Filter by importance (0-5)'),
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

              const toolResult = {
                success: true,
                count: limitedTasks.length,
                total: tasks.length,
                tasks: limitedTasks.map(task => ({
                  id: task.id,
                  name: task.name,
                  importance: task.importance,
                  complexity: task.complexity,
                  isCompleted: task.isCompleted,
                  plannedDate: task.plannedDate?.toISOString().split('T')[0],
                  dueDate: task.dueDate?.toISOString().split('T')[0],
                  subtaskCount: task.subtasks?.length || 0,
                }))
              }

              chatLogger.debug('listTasks tool result', {
                success: true,
                count: toolResult.count,
                total: toolResult.total,
                sampleTask: toolResult.tasks[0]
              })

              chatLogger.info('listTasks tool completed successfully')
              return toolResult
            } catch (error) {
              chatLogger.error('listTasks tool exception', error)
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list tasks'
              }
            }
          }
        })
      }
    })

    return result
  }
}
