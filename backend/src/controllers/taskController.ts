import { Request, Response } from 'express'
import { TaskService } from '../services/taskService'
import { CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../types'

const taskService = new TaskService()

export class TaskController {
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData: CreateTaskRequest = req.body
      const task = await taskService.createTask(taskData)
      res.status(201).json(task)
    } catch (error) {
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
      const task = await taskService.getTaskById(id)

      if (!task) {
        res.status(404).json({ error: 'Task not found' })
        return
      }

      res.json(task)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
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

      const tasks = await taskService.getAllTasks(filters)
      res.json(tasks)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const taskData: UpdateTaskRequest = req.body
      const task = await taskService.updateTask(id, taskData)
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
      await taskService.deleteTask(id)
      res.status(204).send()
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
}
