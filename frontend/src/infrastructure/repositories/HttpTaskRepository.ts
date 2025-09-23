import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { Task, CreateTaskData, UpdateTaskData } from '../../domain/entities/Task'
import { TaskFilters } from '../../domain/types/TaskTypes'
import { tasksApi } from '../../services/api'

export class HttpTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    return await tasksApi.getTasks()
  }

  async getAllWithSubtasks(): Promise<Task[]> {
    return await tasksApi.getAllTasks()
  }

  async getRootTasks(): Promise<Task[]> {
    return await tasksApi.getRootTasks()
  }

  async getById(id: string): Promise<Task | null> {
    try {
      return await tasksApi.getTask(id)
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async getByFilters(filters: TaskFilters): Promise<Task[]> {
    // For now, get all tasks and filter on frontend
    // In a real implementation, you'd pass filters to the API
    const allTasks = await this.getAll()
    return this.filterTasksLocally(allTasks, filters)
  }

  async getCompletedTasks(): Promise<Task[]> {
    // Get all tasks and filter completed ones
    const allTasks = await this.getAll()
    return allTasks.filter(task => task.isCompleted)
  }

  async create(data: CreateTaskData): Promise<Task> {
    return await tasksApi.createTask(data)
  }

  async update(id: string, data: UpdateTaskData): Promise<Task> {
    return await tasksApi.updateTask(id, data)
  }

  async updateNote(id: string, note: string): Promise<Task> {
    return await tasksApi.updateTaskNote(id, note)
  }

  async deleteNote(id: string): Promise<Task> {
    return await tasksApi.deleteTaskNote(id)
  }

  async delete(id: string): Promise<void> {
    await tasksApi.deleteTask(id)
  }

  async deleteAll(): Promise<void> {
    await tasksApi.deleteAllTasks()
  }

  // Bulk operations - implemented as individual calls for now
  async createMany(tasks: CreateTaskData[]): Promise<Task[]> {
    const results: Task[] = []
    for (const taskData of tasks) {
      const created = await this.create(taskData)
      results.push(created)
    }
    return results
  }

  async updateMany(updates: Array<{ id: string; data: UpdateTaskData }>): Promise<Task[]> {
    const results: Task[] = []
    for (const { id, data } of updates) {
      const updated = await this.update(id, data)
      results.push(updated)
    }
    return results
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id)
    }
  }

  // Import/Export operations
  async export(): Promise<Blob> {
    return await tasksApi.exportTasks()
  }

  async import(csvContent: string): Promise<{ message: string; importedCount: number; errors: string[] }> {
    return await tasksApi.importTasks(csvContent)
  }

  // Private helper method for local filtering
  private filterTasksLocally(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesName = task.name.toLowerCase().includes(searchTerm)
        const matchesNote = task.note?.toLowerCase().includes(searchTerm) || false
        if (!matchesName && !matchesNote) return false
      }

      // Importance filter
      if (filters.importance) {
        if (filters.importance.type === 'exact' && task.importance !== filters.importance.value) {
          return false
        }
        if (filters.importance.type === 'gte' && task.importance < filters.importance.value) {
          return false
        }
        if (filters.importance.type === 'lte' && task.importance > filters.importance.value) {
          return false
        }
      }

      // Complexity filter (using urgency filter structure)
      if (filters.urgency) {
        if (filters.urgency.type === 'exact' && task.complexity !== filters.urgency.value) {
          return false
        }
        if (filters.urgency.type === 'gte' && task.complexity < filters.urgency.value) {
          return false
        }
        if (filters.urgency.type === 'lte' && task.complexity > filters.urgency.value) {
          return false
        }
      }

      // Priority (points) filter
      if (filters.priority) {
        if (filters.priority.type === 'exact' && task.points !== filters.priority.value) {
          return false
        }
        if (filters.priority.type === 'gte' && task.points < filters.priority.value) {
          return false
        }
        if (filters.priority.type === 'lte' && task.points > filters.priority.value) {
          return false
        }
      }

      // Tag filter
      if (filters.tagIds && filters.tagIds.length > 0) {
        const taskTagIds = task.tags.map(tag => tag.id)
        const hasMatchingTag = filters.tagIds.some(tagId => taskTagIds.includes(tagId))
        if (!hasMatchingTag) return false
      }

      // Category filter
      if (filters.category) {
        // Would need to implement category detection logic here
        // For now, skip this filter
      }

      // Date filter
      if (filters.dateFilter) {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        switch (filters.dateFilter) {
          case 'today':
            if (!task.dueDate) return false
            const dueDate = new Date(task.dueDate)
            if (dueDate.toDateString() !== today.toDateString()) return false
            break
          case 'tomorrow':
            if (!task.dueDate) return false
            const dueDateTomorrow = new Date(task.dueDate)
            if (dueDateTomorrow.toDateString() !== tomorrow.toDateString()) return false
            break
          case 'overdue':
            if (!task.dueDate) return false
            const overdueDueDate = new Date(task.dueDate)
            if (overdueDueDate >= today) return false
            break
          case 'no-date':
            if (task.dueDate) return false
            break
          case 'this-week':
            if (!task.dueDate) return false
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            const thisWeekDueDate = new Date(task.dueDate)
            if (thisWeekDueDate < weekStart || thisWeekDueDate > weekEnd) return false
            break
        }
      }

      // Completion filter
      if (filters.isCompleted !== undefined) {
        if (task.isCompleted !== filters.isCompleted) return false
      }

      // Has subtasks filter
      if (filters.hasSubtasks !== undefined) {
        const hasSubtasks = task.subtasks && task.subtasks.length > 0
        if (hasSubtasks !== filters.hasSubtasks) return false
      }

      // Parent ID filter
      if (filters.parentId !== undefined) {
        if (task.parentId !== filters.parentId) return false
      }

      return true
    })
  }
}