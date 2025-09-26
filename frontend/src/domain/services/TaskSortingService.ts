import { TaskEntity } from '../entities/Task'

/**
 * Task sorting system implementation
 * Replicates the backend sorting rules (deterministic order):
 * 1. Collected tasks (without date) — new default tasks (importance=0, complexity=3) OR high priority tasks (500+ points)
 * 2. Overdue tasks — tasks past their planned date OR past their due date
 * 3. Today tasks — tasks planned for today OR due today
 * 4. Tomorrow tasks — tasks planned for tomorrow OR due tomorrow
 * 5. Tasks without date — sorted by points DESC (excluding collected tasks already handled)
 * 6. Future tasks (day+2 or more) — sorted by date ASC
 *
 * Note: Due dates within 2 days (today, tomorrow, overdue) are treated as urgent and prioritized like planned dates
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
        const aPlannedDate = a.plannedDate ? TaskSortingService.parseAndNormalizeDate(a.plannedDate) : null
        const bPlannedDate = b.plannedDate ? TaskSortingService.parseAndNormalizeDate(b.plannedDate) : null
        const aDueDate = a.dueDate ? TaskSortingService.parseAndNormalizeDate(a.dueDate) : null
        const bDueDate = b.dueDate ? TaskSortingService.parseAndNormalizeDate(b.dueDate) : null

        // Determine effective date: use due date if urgent (within 2 days), otherwise use planned date
        const aEffectiveDate = aDueDate && aDueDate < dayAfterTomorrow ? aDueDate : aPlannedDate
        const bEffectiveDate = bDueDate && bDueDate < dayAfterTomorrow ? bDueDate : bPlannedDate

        const aIsOverdue = aEffectiveDate && aEffectiveDate < today
        const bIsOverdue = bEffectiveDate && bEffectiveDate < today
        const aIsToday = aEffectiveDate && aEffectiveDate.getTime() === today.getTime()
        const bIsToday = bEffectiveDate && bEffectiveDate.getTime() === today.getTime()
        const aIsTomorrow = aEffectiveDate && aEffectiveDate.getTime() === tomorrow.getTime()
        const bIsTomorrow = bEffectiveDate && bEffectiveDate.getTime() === tomorrow.getTime()
        const aIsFuture = aEffectiveDate && aEffectiveDate >= dayAfterTomorrow
        const bIsFuture = bEffectiveDate && bEffectiveDate >= dayAfterTomorrow

        // Check for collected tasks: either high priority (500+ points) OR new default tasks (importance=0, complexity=3)
        // Only consider as collected if no urgent due date and no planned date
        const aIsCollected = a.isCollected() && !aEffectiveDate
        const bIsCollected = b.isCollected() && !bEffectiveDate

        // 1. Collected tasks (new default tasks OR high priority tasks, only if no due date)
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
          const dateComparison = aEffectiveDate!.getTime() - bEffectiveDate!.getTime()
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
        if (!aEffectiveDate && bEffectiveDate) return -1
        if (aEffectiveDate && !bEffectiveDate) return 1
        if (!aEffectiveDate && !bEffectiveDate) {
          // Both have no date, sort by points DESC
          return b.points - a.points
        }

        // 6. Future tasks (day+2 or more)
        if (aIsFuture && bIsFuture) {
          // Both are future tasks, sort by date ASC
          return aEffectiveDate!.getTime() - bEffectiveDate!.getTime()
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks.filter(task => {
      if (!task.plannedDate) return false
      const plannedDate = new Date(task.plannedDate)
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