import { TaskEntity } from '../entities/Task'

/**
 * Task sorting system implementation
 * Replicates the backend sorting rules (deterministic order):
 * 1. Collected tasks (500+ points without date) — highest priority new tasks
 * 2. Overdue tasks — tasks past their due date
 * 3. Today tasks — tasks due today (including 500-point tasks with today's date)
 * 4. Tomorrow tasks — tasks due tomorrow (including 500-point tasks with tomorrow's date)
 * 5. Tasks without date — sorted by points DESC (excluding 500+ already handled)
 * 6. Future tasks (day+2 or more) — sorted by date ASC
 */
export class TaskSortingService {
  /**
   * Parse date string and normalize to UTC at midnight
   * This ensures consistent date handling across all environments
   */
  static parseAndNormalizeDate(dateInput: string | Date): Date {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    // Create a new date in UTC with the same year, month, day
    const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    return normalizedDate
  }

  /**
   * Sort tasks according to the priority system
   */
  static sortTasksByPriority(tasks: TaskEntity[]): TaskEntity[] {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1))
    const dayAfterTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2))

    return tasks
      .sort((a, b) => {
        // Parse dates and normalize to UTC at midnight
        const aDate = a.dueDate ? TaskSortingService.parseAndNormalizeDate(a.dueDate) : null
        const bDate = b.dueDate ? TaskSortingService.parseAndNormalizeDate(b.dueDate) : null

        const aIsOverdue = aDate && aDate < today
        const bIsOverdue = bDate && bDate < today
        const aIsToday = aDate && aDate.getTime() === today.getTime()
        const bIsToday = bDate && bDate.getTime() === today.getTime()
        const aIsTomorrow = aDate && aDate.getTime() === tomorrow.getTime()
        const bIsTomorrow = bDate && bDate.getTime() === tomorrow.getTime()
        const aIsFuture = aDate && aDate >= dayAfterTomorrow
        const bIsFuture = bDate && bDate >= dayAfterTomorrow

        // Only consider 500+ points for tasks WITHOUT dates (collected tasks)
        const aIsCollected = a.points >= 500 && !aDate
        const bIsCollected = b.points >= 500 && !bDate

        // 1. Collected tasks with 500 points (only if no due date)
        if (aIsCollected && !bIsCollected) return -1
        if (!aIsCollected && bIsCollected) return 1
        if (aIsCollected && bIsCollected) {
          // Both are collected tasks, sort by points DESC, then creation date DESC
          if (a.points !== b.points) return b.points - a.points
          return new Date(b.rawTask.createdAt).getTime() - new Date(a.rawTask.createdAt).getTime()
        }

        // 2. Overdue tasks
        if (aIsOverdue && !bIsOverdue) return -1
        if (!aIsOverdue && bIsOverdue) return 1
        if (aIsOverdue && bIsOverdue) {
          // Both overdue, sort by date ASC (oldest overdue first), then points DESC
          const dateComparison = aDate!.getTime() - bDate!.getTime()
          if (dateComparison !== 0) return dateComparison
          return b.points - a.points
        }

        // 3. Today tasks
        if (aIsToday && !bIsToday) return -1
        if (!aIsToday && bIsToday) return 1
        if (aIsToday && bIsToday) {
          // Both due today, sort by points DESC
          return b.points - a.points
        }

        // 4. Tomorrow tasks
        if (aIsTomorrow && !bIsTomorrow) return -1
        if (!aIsTomorrow && bIsTomorrow) return 1
        if (aIsTomorrow && bIsTomorrow) {
          // Both due tomorrow, sort by points DESC
          return b.points - a.points
        }

        // 5. Tasks without date (excluding the 500+ point ones already handled)
        if (!aDate && bDate) return -1
        if (aDate && !bDate) return 1
        if (!aDate && !bDate) {
          // Both have no date, sort by points DESC
          return b.points - a.points
        }

        // 6. Future tasks (day+2 or more)
        if (aIsFuture && bIsFuture) {
          // Both are future tasks, sort by date ASC
          return aDate!.getTime() - bDate!.getTime()
        }

        // Fallback: sort by points DESC
        return b.points - a.points
      })
      .map((task) => new TaskEntity({
        ...task.rawTask,
        subtasks: TaskSortingService.sortSubtasksByPriority(task.getSubtaskEntities()).map(t => t.rawTask)
      }))
  }

  /**
   * Sort subtasks by points
   */
  static sortSubtasksByPriority(subtasks: TaskEntity[]): TaskEntity[] {
    return subtasks
      .sort((a, b) => TaskSortingService.compareByPoints(a, b))
      .map((subtask) => new TaskEntity({
        ...subtask.rawTask,
        subtasks: TaskSortingService.sortSubtasksByPriority(subtask.getSubtaskEntities()).map(t => t.rawTask)
      }))
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   */
  static compareByPoints(a: TaskEntity, b: TaskEntity): number {
    // Sort by points DESC (higher points = higher priority)
    if (a.points !== b.points) {
      return b.points - a.points
    }

    // If points equal, sort by creation date DESC (newer first)
    return new Date(b.rawTask.createdAt).getTime() - new Date(a.rawTask.createdAt).getTime()
  }

  /**
   * Sort by due date (ascending)
   */
  static sortByDueDate(tasks: TaskEntity[]): TaskEntity[] {
    return [...tasks].sort((a, b) => {
      // Tasks without dates go last
      if (!a.dueDate && b.dueDate) return 1
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && !b.dueDate) return 0

      // Compare dates
      const dateA = new Date(a.dueDate!)
      const dateB = new Date(b.dueDate!)
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
      if (!task.dueDate) return false

      const dueDate = this.parseAndNormalizeDate(task.dueDate)
      return dueDate >= startDate && dueDate <= endDate
    })
  }

  /**
   * Get overdue tasks
   */
  static getOverdueTasks(tasks: TaskEntity[]): TaskEntity[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate < today
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