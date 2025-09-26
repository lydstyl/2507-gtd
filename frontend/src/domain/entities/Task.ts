import { Tag } from './Tag'
import { TaskSortingPriorityService } from '../services/TaskSortingPriorityService'

export type TaskCategory = 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future'

export interface Task {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  plannedDate?: string
  dueDate?: string
  parentId?: string
  userId: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
  subtasks: Task[]
  tags: Tag[]
}

export interface CreateTaskData {
  name: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  plannedDate?: string
  dueDate?: string
  parentId?: string
  tagIds?: string[]
  isCompleted?: boolean
}

export interface UpdateTaskData {
  name?: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  plannedDate?: string | null
  dueDate?: string | null
  parentId?: string
  tagIds?: string[]
  isCompleted?: boolean
  completedAt?: string | null
}

export class TaskEntity {
  constructor(private task: Task) {}

  get id(): string {
    return this.task.id
  }

  get name(): string {
    return this.task.name
  }

  get points(): number {
    return this.task.points
  }

  get importance(): number {
    return this.task.importance
  }

  get complexity(): number {
    return this.task.complexity
  }

  get plannedDate(): string | undefined {
    return this.task.plannedDate
  }

  get dueDate(): string | undefined {
    return this.task.dueDate
  }

  get isCompleted(): boolean {
    return this.task.isCompleted
  }

  get subtasks(): Task[] {
    return this.task.subtasks
  }

  get tags(): Tag[] {
    return this.task.tags
  }

  get rawTask(): Task {
    return this.task
  }

  // Business Logic Methods

  /**
   * Calculate the priority points based on importance and complexity
   */
  calculatePoints(): number {
    if (this.task.complexity === 0) return 0
    return Math.round(10 * this.task.importance / this.task.complexity)
  }

  /**
   * Check if the task is overdue
   */
  isOverdue(): boolean {
    if (!this.task.plannedDate) return false

    try {
      const date = new Date(this.task.plannedDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date < today
    } catch {
      return false
    }
  }

  /**
   * Check if the task is due today
   */
  isDueToday(): boolean {
    if (!this.task.plannedDate) return false

    try {
      const plannedDate = this.parseDate(this.task.plannedDate)
      const today = this.getTodayUTC()
      return plannedDate.getTime() === today.getTime()
    } catch {
      return false
    }
  }

  /**
   * Check if the task is due tomorrow
   */
  isDueTomorrow(): boolean {
    if (!this.task.plannedDate) return false

    try {
      const plannedDate = this.parseDate(this.task.plannedDate)
      const tomorrow = this.getTomorrowUTC()
      return plannedDate.getTime() === tomorrow.getTime()
    } catch {
      return false
    }
  }

  /**
   * Check if task is collected (high priority without dates OR new default tasks)
   * Delegates to domain service for business logic
   */
  isCollected(): boolean {
    const dateContext = TaskSortingPriorityService.createDateContext()
    return TaskSortingPriorityService.isCollectedTask(this.task, dateContext)
  }

  /**
   * Get the task category for sorting and display
   * Delegates to domain service for business logic
   */
  getCategory(): TaskCategory {
    const dateContext = TaskSortingPriorityService.createDateContext()
    return TaskSortingPriorityService.getTaskCategory(this.task, dateContext)
  }

  /**
   * Get the day of week for the due date (0 = Sunday, 6 = Saturday)
   */
  getDayOfWeek(): number {
    if (!this.task.plannedDate) return -1

    try {
      const date = new Date(this.task.plannedDate)
      return date.getDay()
    } catch {
      return -1
    }
  }

  /**
   * Check if task has subtasks
   */
  hasSubtasks(): boolean {
    return this.task.subtasks && this.task.subtasks.length > 0
  }

  /**
   * Check if task is a subtask (has parent)
   */
  isSubtask(): boolean {
    return !!this.task.parentId
  }

  /**
   * Get all subtasks as TaskEntity instances
   */
  getSubtaskEntities(): TaskEntity[] {
    return this.task.subtasks.map(subtask => new TaskEntity(subtask))
  }

  // Private helper methods

  private parseDate(dateInput: string | Date): Date {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  private getTodayUTC(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  }

  private getTomorrowUTC(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  }

  private getDayAfterTomorrowUTC(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2))
  }

}