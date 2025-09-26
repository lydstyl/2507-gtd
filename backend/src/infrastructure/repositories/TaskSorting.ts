import { TaskWithSubtasks } from '../../domain/entities/Task'
import { TaskPriorityService } from '../../domain/services/TaskPriorityService'

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
   * Sort tasks according to the priority system using domain service
   */
  static sortTasksByPriority(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks
      .sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))
      .map((task) => ({
        ...task,
        subtasks: TaskSorting.sortSubtasksByPriority(task.subtasks)
      }))
  }

  /**
   * Sort subtasks by points using domain service
   */
  static sortSubtasksByPriority(subtasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    return subtasks
      .sort((a, b) => TaskPriorityService.compareByPoints(a, b))
      .map((subtask) => ({
        ...subtask,
        subtasks: TaskSorting.sortSubtasksByPriority(subtask.subtasks)
      }))
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   * Delegates to domain service
   */
  static compareByPoints(a: TaskWithSubtasks, b: TaskWithSubtasks): number {
    return TaskPriorityService.compareByPoints(a, b)
  }
}