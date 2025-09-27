import type { GenericTaskWithSubtasks, TaskCategory, DateContext } from './TaskTypes'
import { TaskPriorityService } from '../services/TaskPriorityService'

/**
 * Generic Task Entity that works with both Date objects (backend) and string dates (frontend)
 * Contains business logic methods for task operations
 */
export class TaskEntity<TDate extends string | Date = string | Date> {
  private readonly task: GenericTaskWithSubtasks<TDate>

  constructor(task: GenericTaskWithSubtasks<TDate>) {
    this.task = task
  }

  // Getters
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

  get plannedDate(): TDate | undefined {
    return this.task.plannedDate
  }

  get dueDate(): TDate | undefined {
    return this.task.dueDate
  }

  get isCompleted(): boolean {
    return this.task.isCompleted
  }

  get subtasks(): GenericTaskWithSubtasks<TDate>[] {
    return this.task.subtasks
  }

  get tags(): GenericTaskWithSubtasks<TDate>['tags'] {
    return this.task.tags
  }

  get rawTask(): GenericTaskWithSubtasks<TDate> {
    return this.task
  }

  // Business Logic Methods

  /**
   * Calculate the priority points based on importance and complexity
   */
  calculatePoints(): number {
    return TaskPriorityService.calculatePoints(this.task.importance, this.task.complexity)
  }

  /**
   * Check if the task is overdue
   */
  isOverdue(): boolean {
    try {
      const context = TaskPriorityService.createDateContext()
      return TaskPriorityService.isOverdueTask(this.task, context)
    } catch {
      return false
    }
  }

  /**
   * Check if the task is due today
   */
  isDueToday(): boolean {
    try {
      const context = TaskPriorityService.createDateContext()
      return TaskPriorityService.isTodayTask(this.task, context)
    } catch {
      return false
    }
  }

  /**
   * Check if the task is due tomorrow
   */
  isDueTomorrow(): boolean {
    try {
      const context = TaskPriorityService.createDateContext()
      return TaskPriorityService.isTomorrowTask(this.task, context)
    } catch {
      return false
    }
  }

  /**
   * Check if task is collected (business rule)
   * Collected tasks are only new default tasks: importance=0, complexity=3, no effective date
   */
  isCollected(): boolean {
    const dateContext = TaskPriorityService.createDateContext()
    return TaskPriorityService.isCollectedTask(this.task, dateContext)
  }

  /**
   * Get the task category for sorting and display
   */
  getCategory(): TaskCategory {
    const dateContext = TaskPriorityService.createDateContext()
    return TaskPriorityService.getTaskCategory(this.task, dateContext)
  }

  /**
   * Get the day of week for the due date (0 = Sunday, 6 = Saturday)
   */
  getDayOfWeek(): number {
    if (!this.task.plannedDate) return -1

    try {
      const date = new Date(this.task.plannedDate as string | number | Date)
      if (isNaN(date.getTime())) return -1
      return date.getDay()
    } catch {
      return -1
    }
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
  getSubtaskEntities(): TaskEntity<TDate>[] {
    return this.task.subtasks.map(subtask => new TaskEntity(subtask))
  }

  /**
   * Get the effective date for this task (planned or urgent due date)
   */
  getEffectiveDate(): Date | null {
    const context = TaskPriorityService.createDateContext()
    return TaskPriorityService.getEffectiveDate(this.task, context)
  }

  /**
   * Check if this task's effective date is urgent (within 2 days)
   */
  isDateUrgent(): boolean {
    const context = TaskPriorityService.createDateContext()
    const effectiveDate = this.getEffectiveDate()
    return effectiveDate ? TaskPriorityService.isDateUrgent(effectiveDate, context) : false
  }
}