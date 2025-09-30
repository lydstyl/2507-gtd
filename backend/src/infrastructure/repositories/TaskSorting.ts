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
   * Sort subtasks by position first, then by points
   * Position allows manual reordering via drag & drop
   */
  static sortSubtasksByPriority(subtasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    return subtasks
      .map(subtask => TaskAdapter.toSharedDomain(subtask))
      .sort((a, b) => {
        // If both have custom position (non-zero), sort by position descending
        if (a.position !== 0 && b.position !== 0) {
          return b.position - a.position
        }
        // If only one has custom position, it goes first
        if (a.position !== 0) return -1
        if (b.position !== 0) return 1
        // Otherwise sort by points
        return TaskPriorityService.compareByPoints(a, b)
      })
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