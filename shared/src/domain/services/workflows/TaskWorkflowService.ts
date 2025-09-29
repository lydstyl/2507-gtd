/**
 * Shared task lifecycle workflow management
 * Encapsulates complex business workflows for task state transitions
 */

import type { TaskBase } from '../../entities/TaskTypes'
import type { OperationResult } from '../../types/OperationResult'

export interface TaskCompletionData {
  /**
   * Timestamp when the task was completed
   */
  completedAt: Date | string
  /**
   * Whether to also complete subtasks
   */
  completeSubtasks?: boolean
}

export interface TaskStateTransition<TDate = Date | string> {
  /**
   * Previous state of the task
   */
  previousState: Partial<TaskBase<TDate>>
  /**
   * New state of the task
   */
  newState: Partial<TaskBase<TDate>>
  /**
   * Reason for the transition
   */
  reason: string
  /**
   * Timestamp of the transition
   */
  timestamp: TDate
}

export class TaskWorkflowService {
  /**
   * Validate if a task can be marked as completed
   */
  static canComplete<TDate = Date | string>(
    task: TaskBase<TDate>
  ): OperationResult<boolean> {
    // Task is already completed
    if (task.isCompleted) {
      return {
        success: false,
        error: { code: "OPERATION_ERROR", message: 'Task is already completed'},
        data: false
      }
    }

    // Task can be completed
    return {
      success: true,
      data: true
    }
  }

  /**
   * Prepare task completion data
   */
  static prepareCompletion<TDate = Date | string>(
    task: TaskBase<TDate>,
    completedAt: TDate
  ): Partial<TaskBase<TDate>> {
    return {
      isCompleted: true,
      completedAt
    }
  }

  /**
   * Validate if a task can be reopened (uncompleted)
   */
  static canReopen<TDate = Date | string>(
    task: TaskBase<TDate>
  ): OperationResult<boolean> {
    // Task is not completed
    if (!task.isCompleted) {
      return {
        success: false,
        error: { code: "OPERATION_ERROR", message: 'Task is not completed'},
        data: false
      }
    }

    // Task can be reopened
    return {
      success: true,
      data: true
    }
  }

  /**
   * Prepare task reopening data
   */
  static prepareReopening<TDate = Date | string>(
    task: TaskBase<TDate>
  ): Partial<TaskBase<TDate>> {
    return {
      isCompleted: false,
      completedAt: undefined
    }
  }

  /**
   * Check if a task is overdue
   */
  static isOverdue<TDate = Date | string>(
    task: TaskBase<TDate>,
    now: Date
  ): boolean {
    if (!task.plannedDate) return false
    if (task.isCompleted) return false

    const plannedDate = typeof task.plannedDate === 'string'
      ? new Date(task.plannedDate)
      : task.plannedDate as unknown as Date

    // Normalize to start of day for comparison
    const plannedDay = new Date(plannedDate.getTime())
    plannedDay.setHours(0, 0, 0, 0)

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    return plannedDay < today
  }

  /**
   * Check if a task is due today
   */
  static isDueToday<TDate = Date | string>(
    task: TaskBase<TDate>,
    now: Date
  ): boolean {
    if (!task.plannedDate) return false
    if (task.isCompleted) return false

    const plannedDate = typeof task.plannedDate === 'string'
      ? new Date(task.plannedDate)
      : task.plannedDate as unknown as Date

    // Normalize to start of day for comparison
    const plannedDay = new Date(plannedDate.getTime())
    plannedDay.setHours(0, 0, 0, 0)

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    return plannedDay.getTime() === today.getTime()
  }

  /**
   * Calculate days until task is due
   */
  static getDaysUntilDue<TDate = Date | string>(
    task: TaskBase<TDate>,
    now: Date
  ): number | null {
    if (!task.plannedDate) return null

    const plannedDate = typeof task.plannedDate === 'string'
      ? new Date(task.plannedDate)
      : task.plannedDate as unknown as Date

    // Normalize to start of day for comparison
    const plannedDay = new Date(plannedDate.getTime())
    plannedDay.setHours(0, 0, 0, 0)

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const diffTime = plannedDay.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * Get task urgency level
   */
  static getUrgencyLevel<TDate = Date | string>(
    task: TaskBase<TDate>,
    now: Date
  ): 'overdue' | 'today' | 'soon' | 'future' | 'none' {
    if (task.isCompleted) return 'none'
    if (!task.plannedDate) return 'none'

    if (this.isOverdue(task, now)) return 'overdue'
    if (this.isDueToday(task, now)) return 'today'

    const daysUntil = this.getDaysUntilDue(task, now)
    if (daysUntil !== null) {
      if (daysUntil <= 3) return 'soon'
      return 'future'
    }

    return 'none'
  }

  /**
   * Validate parent-child task relationships
   */
  static validateParentChild<TDate = Date | string>(
    task: TaskBase<TDate>,
    potentialParentId: string | undefined
  ): OperationResult<boolean> {
    // Cannot be its own parent
    if (potentialParentId === task.id) {
      return {
        success: false,
        error: { code: "OPERATION_ERROR", message: 'Task cannot be its own parent'},
        data: false
      }
    }

    // Note: Circular dependency checks would require access to repository
    // This should be done in the use case layer

    return {
      success: true,
      data: true
    }
  }
}