import type { Tag } from './Tag'
import { TaskPriorityService } from '@gtd/shared'
import { TaskAdapter } from '../services/TaskAdapter'

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
  private readonly task: Task

  constructor(task: Task) {
    this.task = task
  }

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
    if (!this.task.plannedDate && !this.task.dueDate) return false

    try {
      // Use shared TaskPriorityService for consistency with getCategory
      const context = TaskPriorityService.createDateContext()
      const sharedTask = TaskAdapter.toSharedDomain(this.task)
      return TaskPriorityService.isOverdueTask(sharedTask, context)
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
      // Use shared TaskPriorityService for consistency with getCategory
      const context = TaskPriorityService.createDateContext()
      const sharedTask = TaskAdapter.toSharedDomain(this.task)
      return TaskPriorityService.isTodayTask(sharedTask, context)
    } catch {
      return false
    }
  }

  /**
    * Check if the task is due tomorrow
    */
  isDueTomorrow(): boolean {
    if (!this.task.plannedDate && !this.task.dueDate) return false

    try {
      // Use shared TaskPriorityService for consistency with getCategory
      const context = TaskPriorityService.createDateContext()
      const sharedTask = TaskAdapter.toSharedDomain(this.task)
      return TaskPriorityService.isTomorrowTask(sharedTask, context)
    } catch {
      return false
    }
  }

  /**
    * Check if task is collected (high priority without dates OR new default tasks)
    * Delegates to domain service for business logic
    */
  isCollected(): boolean {
    const dateContext = TaskPriorityService.createDateContext()
    const sharedTask = TaskAdapter.toSharedDomain(this.task)
    return TaskPriorityService.isCollectedTask(sharedTask, dateContext)
  }

  /**
    * Get the task category for sorting and display
    * Delegates to domain service for business logic
    */
  getCategory(): TaskCategory {
    const dateContext = TaskPriorityService.createDateContext()
    const sharedTask = TaskAdapter.toSharedDomain(this.task)
    return TaskPriorityService.getTaskCategory(sharedTask, dateContext)
  }

  /**
   * Get the day of week for the due date (0 = Sunday, 6 = Saturday)
   */
  getDayOfWeek(): number {
    if (!this.task.plannedDate) return -1

    const date = new Date(this.task.plannedDate)
    if (isNaN(date.getTime())) return -1

    return date.getDay()
  }

  /**
   * Check if task has subtasks
   */
  hasSubtasks(): boolean {
    return Boolean(this.task.subtasks && this.task.subtasks.length > 0)
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



}