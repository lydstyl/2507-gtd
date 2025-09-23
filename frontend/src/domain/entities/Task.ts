import { Tag } from './Tag'

export type TaskCategory = 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future'

export interface Task {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
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
    if (!this.task.dueDate) return false

    try {
      const date = new Date(this.task.dueDate)
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
    if (!this.task.dueDate) return false

    try {
      const dueDate = this.parseDate(this.task.dueDate)
      const today = this.getTodayUTC()
      return dueDate.getTime() === today.getTime()
    } catch {
      return false
    }
  }

  /**
   * Check if the task is due tomorrow
   */
  isDueTomorrow(): boolean {
    if (!this.task.dueDate) return false

    try {
      const dueDate = this.parseDate(this.task.dueDate)
      const tomorrow = this.getTomorrowUTC()
      return dueDate.getTime() === tomorrow.getTime()
    } catch {
      return false
    }
  }

  /**
   * Check if task is collected (high priority without due date)
   */
  isCollected(): boolean {
    return this.task.points >= 500 && !this.task.dueDate
  }

  /**
   * Get the task category for sorting and display
   */
  getCategory(): TaskCategory {
    // 1. High priority tasks with 500+ points WITHOUT dates (collected tasks)
    if (this.isCollected()) {
      return 'collected'
    }

    // 2. Overdue tasks
    if (this.isOverdue()) {
      return 'overdue'
    }

    // 3. Today tasks
    if (this.isDueToday()) {
      return 'today'
    }

    // 4. Tomorrow tasks
    if (this.isDueTomorrow()) {
      return 'tomorrow'
    }

    // 5. Tasks without date
    if (!this.task.dueDate) {
      return 'no-date'
    }

    // 6. Future tasks (day+2 or more)
    try {
      const dueDate = this.parseDate(this.task.dueDate)
      const dayAfterTomorrow = this.getDayAfterTomorrowUTC()

      if (dueDate >= dayAfterTomorrow) {
        return 'future'
      }
    } catch {
      // Fallback for invalid dates
    }

    return 'no-date'
  }

  /**
   * Get the day of week for the due date (0 = Sunday, 6 = Saturday)
   */
  getDayOfWeek(): number {
    if (!this.task.dueDate) return -1

    try {
      const date = new Date(this.task.dueDate)
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