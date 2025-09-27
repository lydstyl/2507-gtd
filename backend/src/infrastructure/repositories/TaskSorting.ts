import { TaskWithSubtasks } from '../../domain/entities/Task'
import { TaskPriorityService } from '@gtd/shared'
import { TaskAdapter } from '../adapters/TaskAdapter'

/**
 * Infrastructure implementation of task sorting
 * Uses domain services for business logic while handling infrastructure concerns
 * like date parsing and database-specific optimizations
 */
export class TaskSorting {
  /**
   * Parse date string and normalize to UTC at midnight
   * This ensures consistent date handling across all environments (dev/prod, SQLite/PostgreSQL)
   */
  static parseAndNormalizeDate(dateInput: string | Date): Date {
    return TaskPriorityService.normalizeDate(dateInput)
  }

  /**
   * Sort tasks according to the priority system using shared domain service
   */
  static sortTasksByPriority(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks
      .map(task => TaskAdapter.toSharedDomain(task))
      .sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))
      .map((task) => TaskAdapter.fromSharedDomain(task))
      .map((task) => ({
        ...task,
        subtasks: TaskSorting.sortSubtasksByPriority(task.subtasks)
      }))
  }

  /**
   * Sort subtasks by points using shared domain service
   */
  static sortSubtasksByPriority(subtasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    return subtasks
      .map(subtask => TaskAdapter.toSharedDomain(subtask))
      .sort((a, b) => TaskPriorityService.compareByPoints(a, b))
      .map(subtask => TaskAdapter.fromSharedDomain(subtask))
      .map((subtask) => ({
        ...subtask,
        subtasks: TaskSorting.sortSubtasksByPriority(subtask.subtasks)
      }))
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   * Delegates to shared domain service
   */
  static compareByPoints(a: TaskWithSubtasks, b: TaskWithSubtasks): number {
    const sharedA = TaskAdapter.toSharedDomain(a)
    const sharedB = TaskAdapter.toSharedDomain(b)
    return TaskPriorityService.compareByPoints(sharedA, sharedB)
  }
}