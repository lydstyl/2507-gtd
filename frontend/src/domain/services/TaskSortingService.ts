import { TaskEntity } from '../entities/Task'
import { TaskSortingPriorityService } from './TaskSortingPriorityService'

/**
 * Task sorting system implementation
 * Uses domain services for business logic while providing UI-specific sorting methods
 */
export class TaskSortingService {
  /**
   * Parse date string and normalize to UTC at midnight
   * Delegates to domain service for consistency
   */
  static parseAndNormalizeDate(dateInput: string | Date): Date {
    return TaskSortingPriorityService.normalizeDate(dateInput)
  }

  /**
    * Sort tasks according to the priority system using domain service
    */
  static sortTasksByPriority(tasks: TaskEntity[]): TaskEntity[] {
    const dateContext = TaskSortingPriorityService.createDateContext()

    return [...tasks]
      .sort((a, b) => TaskSortingPriorityService.compareTasksPriority(a.rawTask, b.rawTask, dateContext))
      .map((task) => new TaskEntity({
        ...task.rawTask,
        subtasks: TaskSortingService.sortSubtasksByPriority(task.getSubtaskEntities()).map(t => t.rawTask)
      }))
  }

  /**
    * Sort subtasks by points using domain service
    */
  static sortSubtasksByPriority(subtasks: TaskEntity[]): TaskEntity[] {
    return [...subtasks]
      .sort((a, b) => TaskSortingPriorityService.compareByPoints(a.rawTask, b.rawTask))
      .map((subtask) => new TaskEntity({
        ...subtask.rawTask,
        subtasks: TaskSortingService.sortSubtasksByPriority(subtask.getSubtaskEntities()).map(t => t.rawTask)
      }))
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   * Delegates to domain service
   */
  static compareByPoints(a: TaskEntity, b: TaskEntity): number {
    return TaskSortingPriorityService.compareByPoints(a.rawTask, b.rawTask)
  }

  /**
   * Sort by due date (ascending)
   */
  static sortByDueDate(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => {
      // Tasks without dates go last
      if (!a.plannedDate && b.plannedDate) return 1
      if (a.plannedDate && !b.plannedDate) return -1
      if (!a.plannedDate && !b.plannedDate) return 0

      // Compare dates
      const dateA = new Date(a.plannedDate!)
      const dateB = new Date(b.plannedDate!)
      return dateA.getTime() - dateB.getTime()
    })
  }

  /**
   * Sort by creation date (newest first)
   */
  static sortByCreationDate(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.rawTask.createdAt)
      const dateB = new Date(b.rawTask.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
  }

  /**
   * Sort by completion date (newest first)
   */
  static sortByCompletionDate(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => {
      // Incomplete tasks go first
      if (!a.rawTask.completedAt && b.rawTask.completedAt) return -1
      if (a.rawTask.completedAt && !b.rawTask.completedAt) return 1
      if (!a.rawTask.completedAt && !b.rawTask.completedAt) return 0

      // Compare completion dates
      const dateA = new Date(a.rawTask.completedAt!)
      const dateB = new Date(b.rawTask.completedAt!)
      return dateB.getTime() - dateA.getTime()
    })
  }

  /**
   * Sort alphabetically by name
   */
  static sortByName(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Sort by importance (highest first)
   */
  static sortByImportance(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance
      }
      // Secondary sort by points
      return b.points - a.points
    })
  }

  /**
   * Sort by complexity (simplest first)
   */
  static sortByComplexity(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => {
      if (a.complexity !== b.complexity) {
        return a.complexity - b.complexity
      }
      // Secondary sort by points (highest first)
      return b.points - a.points
    })
  }

  /**
   * Get tasks due in a specific time range
   */
  static getTasksDueInRange(tasks: TaskEntity[], startDate: Date, endDate: Date): TaskEntity[] {
    return tasks.filter(task => {
      if (!task.plannedDate) return false

      const plannedDate = this.parseAndNormalizeDate(task.plannedDate)
      return plannedDate >= startDate && plannedDate <= endDate
    })
  }

  /**
    * Get overdue tasks
    */
  static getOverdueTasks(tasks: TaskEntity[]): TaskEntity[] {
    const today = TaskSortingPriorityService.createDateContext().today

    return tasks.filter(task => {
      if (!task.plannedDate) return false
      const plannedDate = TaskSortingPriorityService.normalizeDate(task.plannedDate)
      return plannedDate < today
    })
  }

  /**
   * Get tasks due today
   */
  static getTodayTasks(tasks: TaskEntity[]): TaskEntity[] {
    return tasks.filter(task => task.isDueToday())
  }

  /**
   * Get tasks due tomorrow
   */
  static getTomorrowTasks(tasks: TaskEntity[]): TaskEntity[] {
    return tasks.filter(task => task.isDueTomorrow())
  }

  /**
   * Get collected tasks (high priority without dates)
   */
  static getCollectedTasks(tasks: TaskEntity[]): TaskEntity[] {
    return tasks.filter(task => task.isCollected())
  }
}