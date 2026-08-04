import { Request, Response } from 'express'
import { CreateTaskUseCase } from '../../usecases/tasks/CreateTaskUseCase'
import { GetTaskUseCase } from '../../usecases/tasks/GetTaskUseCase'
import { GetAllTasksUseCase } from '../../usecases/tasks/GetAllTasksUseCase'
import { UpdateTaskUseCase } from '../../usecases/tasks/UpdateTaskUseCase'
import { DeleteTaskUseCase } from '../../usecases/tasks/DeleteTaskUseCase'
import { ExportTasksUseCase } from '../../usecases/tasks/ExportTasksUseCase'
import { ImportTasksUseCase } from '../../usecases/tasks/ImportTasksUseCase'
import { MarkTaskAsCompletedUseCase } from '../../usecases/tasks/MarkTaskAsCompletedUseCase'
import { WorkedOnTaskUseCase } from '../../usecases/tasks/WorkedOnTaskUseCase'
import { GetCompletionStatsUseCase } from '../../usecases/tasks/GetCompletionStatsUseCase'
import { GetCompletedTasksUseCase } from '../../usecases/tasks/GetCompletedTasksUseCase'
import { TaskFilters } from '../../interfaces/repositories/TaskRepository'
import { QueryOptions } from '@gtd/shared'

/**
 * Convert basic markdown to HTML for note fields.
 * Supports: bold, italic, headings, bullet lists, ordered lists, links, code, line breaks.
 * If content already looks like HTML, pass through unchanged.
 */
function markdownToHtml(text: string): string {
  if (!text) return text
  // If already HTML, pass through
  if (/^<[^>]+>/.test(text.trim()) || /<[hbpuo][^>]*>/i.test(text)) return text

  let html = text

  // Escape HTML special chars first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic *text*
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')

  // Strike ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>')

  // Headings (must be at start of line)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>')

  // Ordered lists
  html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match: string) => `<ol>${match}</ol>`)

  // Bullet lists
  html = html.replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match: string) => {
    // Don't re-wrap if already in <ol>
    if (/<ol>/.test(match)) return match
    return `<ul>${match}</ul>`
  })

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br>')

  // Wrap in paragraph if not already wrapped
  if (!/^<[hbpuo]/.test(html.trim())) {
    html = `<p>${html}</p>`
  }

  return html
}

export class TaskController {
  constructor(
    private createTaskUseCase: CreateTaskUseCase,
    private getTaskUseCase: GetTaskUseCase,
    private getAllTasksUseCase: GetAllTasksUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase,
    private exportTasksUseCase: ExportTasksUseCase,
    private importTasksUseCase: ImportTasksUseCase,
    private markTaskAsCompletedUseCase: MarkTaskAsCompletedUseCase,
    private workedOnTaskUseCase: WorkedOnTaskUseCase,
    private getCompletionStatsUseCase: GetCompletionStatsUseCase,
    private getCompletedTasksUseCase: GetCompletedTasksUseCase
  ) {}

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const taskData = { ...req.body, userId }
      // Convert markdown note to HTML if needed
      if (taskData.note && typeof taskData.note === 'string') {
        taskData.note = markdownToHtml(taskData.note)
      }
      const result = await this.createTaskUseCase.execute(taskData)
      if (!result.success) {
        if (result.error?.code === 'VALIDATION_ERROR') {
          res.status(400).json({ error: result.error.message })
          return
        }
        res.status(500).json({ error: result.error?.message || 'Failed to create task' })
        return
      }
      res.status(201).json(result.data)
    } catch (error) {
      console.error('❌ Erreur dans createTask:', error)
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const userId = (req as any).user?.userId
      const task = await this.getTaskUseCase.execute(id, userId)
      res.json(task)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const filters: TaskFilters = { userId }

      // Parse query parameters
      if (req.query.parentId) {
        filters.parentId = req.query.parentId as string
      }
      if (req.query.importance) {
        filters.importance = parseInt(req.query.importance as string)
      }
      if (req.query.complexity) {
        filters.complexity = parseInt(req.query.complexity as string)
      }
      if (req.query.search) {
        filters.search = req.query.search as string
      }
      if (req.query.tagIds) {
        filters.tagIds = Array.isArray(req.query.tagIds)
          ? (req.query.tagIds as string[])
          : [req.query.tagIds as string]
      }
      
      // Si includeSubtasks est spécifié, on ne filtre pas par parentId
      if (req.query.includeSubtasks === 'true') {
        delete filters.parentId
      }

      const tasks = await this.getAllTasksUseCase.execute(
        userId,
        filters,
        this.parseQueryOptions(req)
      )
      res.json(tasks)
    } catch (error) {
      console.error('❌ Erreur dans getAllTasks:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getAllRootTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const filters: TaskFilters = { userId }

      // Parse query parameters
      if (req.query.importance) {
        filters.importance = parseInt(req.query.importance as string)
      }
      if (req.query.complexity) {
        filters.complexity = parseInt(req.query.complexity as string)
      }
      if (req.query.search) {
        filters.search = req.query.search as string
      }
      if (req.query.tagIds) {
        filters.tagIds = Array.isArray(req.query.tagIds)
          ? (req.query.tagIds as string[])
          : [req.query.tagIds as string]
      }

      const tasks = await this.getAllTasksUseCase.executeRootTasks(
        userId,
        filters,
        this.parseQueryOptions(req)
      )
      res.json(tasks)
    } catch (error) {
      console.error('❌ Erreur dans getAllRootTasks:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const taskData = { ...req.body, userId }
      // Convert markdown note to HTML if needed
      if (taskData.note && typeof taskData.note === 'string') {
        taskData.note = markdownToHtml(taskData.note)
      }
      const result = await this.updateTaskUseCase.execute({ id, data: taskData })
      if (!result.success) {
        if (result.error?.code === 'VALIDATION_ERROR') {
          res.status(400).json({ error: result.error.message })
          return
        }
        res.status(500).json({ error: result.error?.message || 'Failed to update task' })
        return
      }
      const task = result.data
      res.json(task)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      await this.deleteTaskUseCase.execute(id, userId)
      res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('access denied')
        ) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async exportTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const csvContent = await this.exportTasksUseCase.execute(userId)

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="tasks-export.csv"'
      )

      res.send(csvContent)
    } catch (error) {
      console.error('❌ Erreur dans exportTasks:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async importTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { csvContent } = req.body
      if (!csvContent) {
        res.status(400).json({ error: 'CSV content is required' })
        return
      }

      const result = await this.importTasksUseCase.execute(userId, csvContent)

      res.json({
        message: `Import terminé. ${result.importedCount} tâches importées.`,
        importedCount: result.importedCount,
        errors: result.errors
      })
    } catch (error) {
      console.error('❌ Erreur dans importTasks:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async deleteAllUserTasks(req: any, res: any) {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      await this.deleteTaskUseCase.deleteAllByUserId(userId)
      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression des tâches.' })
    }
  }

  async markTaskAsCompleted(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const task = await this.markTaskAsCompletedUseCase.execute(id, userId)
      res.json(task)
    } catch (error) {
      console.error('❌ Erreur dans markTaskAsCompleted:', error)
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Access denied')) {
          res.status(404).json({ error: error.message })
        } else if (error.message.includes('already completed')) {
          res.status(400).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async workedOnTask(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const completedTask = await this.workedOnTaskUseCase.execute(id, userId)
      res.status(201).json(completedTask)
    } catch (error) {
      console.error('❌ Erreur dans workedOnTask:', error)
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }

  async getCompletionStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const stats = await this.getCompletionStatsUseCase.execute(userId)
      res.json(stats)
    } catch (error) {
      console.error('❌ Erreur dans getCompletionStats:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getCompletedTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      const { startDate, endDate } = req.query
      const tasks = await this.getCompletedTasksUseCase.execute(
        userId,
        startDate as string,
        endDate as string
      )
      res.json(tasks)
    } catch (error) {
      console.error('❌ Erreur dans getCompletedTasks:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * Parse les paramètres de pagination `limit` / `offset` des requêtes de
   * liste. Avant ce fix, `limit` était envoyé par le MCP mais ignoré par le
   * controller — toutes les tâches étaient renvoyées, notes comprises.
   * `limit` est plafonné à 1000 (les scripts Hermes utilisent jusqu'à 500).
   */
  private parseQueryOptions(req: Request): QueryOptions {
    const options: QueryOptions = {}

    if (req.query.limit !== undefined) {
      const limit = parseInt(req.query.limit as string, 10)
      if (!isNaN(limit) && limit > 0) {
        options.limit = Math.min(limit, 1000)
      }
    }

    if (req.query.offset !== undefined) {
      const offset = parseInt(req.query.offset as string, 10)
      if (!isNaN(offset) && offset >= 0) {
        options.offset = offset
      }
    }

    return options
  }
}
