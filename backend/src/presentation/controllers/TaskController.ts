import { Request, Response } from 'express'
import { CreateTaskUseCase } from '../../usecases/tasks/CreateTaskUseCase'
import { GetTaskUseCase } from '../../usecases/tasks/GetTaskUseCase'
import { GetAllTasksUseCase } from '../../usecases/tasks/GetAllTasksUseCase'
import { UpdateTaskUseCase } from '../../usecases/tasks/UpdateTaskUseCase'
import { DeleteTaskUseCase } from '../../usecases/tasks/DeleteTaskUseCase'
import { TaskFilters } from '../../interfaces/repositories/TaskRepository'

export class TaskController {
  constructor(
    private createTaskUseCase: CreateTaskUseCase,
    private getTaskUseCase: GetTaskUseCase,
    private getAllTasksUseCase: GetAllTasksUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase
  ) {}

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 createTask appelé')
      console.log('Body:', req.body)
      
      const userId = (req as any).user?.userId
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      const taskData = { ...req.body, userId }
      console.log('TaskData avec userId:', taskData)
      
      const task = await this.createTaskUseCase.execute(taskData)
      console.log('✅ Tâche créée:', task.id, 'ParentId:', task.parentId)
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
      console.log('🔍 getAllTasks appelé')
      console.log('User:', (req as any).user)
      
      const filters: TaskFilters = {}

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

      const userId = (req as any).user?.userId
      console.log('UserId:', userId)
      console.log('Filters:', filters)
      
      if (!userId) {
        console.log('❌ UserId manquant')
        res.status(401).json({ error: 'User not authenticated' })
        return
      }
      
      const tasks = await this.getAllTasksUseCase.execute(userId, filters)
      console.log('✅ Tâches récupérées:', tasks.length)
      res.json(tasks)
    } catch (error) {
      console.error('❌ Erreur dans getAllTasks:', error)
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
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
}
