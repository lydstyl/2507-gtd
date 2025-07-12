import { Request, Response } from 'express'
import { CreateTaskUseCase } from '../../usecases/tasks/CreateTaskUseCase'
import { GetTaskUseCase } from '../../usecases/tasks/GetTaskUseCase'
import { GetAllTasksUseCase } from '../../usecases/tasks/GetAllTasksUseCase'
import { UpdateTaskUseCase } from '../../usecases/tasks/UpdateTaskUseCase'
import { DeleteTaskUseCase } from '../../usecases/tasks/DeleteTaskUseCase'
import { ExportTasksUseCase } from '../../usecases/tasks/ExportTasksUseCase'
import { ImportTasksUseCase } from '../../usecases/tasks/ImportTasksUseCase'
import { TaskFilters } from '../../interfaces/repositories/TaskRepository'

export class TaskController {
  constructor(
    private createTaskUseCase: CreateTaskUseCase,
    private getTaskUseCase: GetTaskUseCase,
    private getAllTasksUseCase: GetAllTasksUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase,
    private exportTasksUseCase: ExportTasksUseCase,
    private importTasksUseCase: ImportTasksUseCase
  ) {}

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const taskData = { ...req.body, userId }
      const task = await this.createTaskUseCase.execute(taskData)
      res.status(201).json(task)
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
      const { id } = req.params
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
      if (req.query.urgency) {
        filters.urgency = parseInt(req.query.urgency as string)
      }
      if (req.query.priority) {
        filters.priority = parseInt(req.query.priority as string)
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

      const tasks = await this.getAllTasksUseCase.execute(userId, filters)
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
      if (req.query.urgency) {
        filters.urgency = parseInt(req.query.urgency as string)
      }
      if (req.query.priority) {
        filters.priority = parseInt(req.query.priority as string)
      }
      if (req.query.search) {
        filters.search = req.query.search as string
      }
      if (req.query.tagIds) {
        filters.tagIds = Array.isArray(req.query.tagIds)
          ? (req.query.tagIds as string[])
          : [req.query.tagIds as string]
      }

      const tasks = await this.getAllTasksUseCase.executeRootTasks(userId, filters)
      res.json(tasks)
    } catch (error) {
      console.error('❌ Erreur dans getAllRootTasks:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const taskData = { ...req.body, userId }
      const task = await this.updateTaskUseCase.execute(id, taskData)
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
      const { id } = req.params
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
}
