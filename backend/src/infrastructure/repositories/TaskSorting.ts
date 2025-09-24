import { TaskWithSubtasks } from '../../domain/entities/Task'

/**
 * Task sorting system implementation
 * Sorting rules (deterministic order):
 * 1. Collected tasks (without date) — new default tasks (importance=0, complexity=3) OR high priority tasks (500+ points)
 * 2. Overdue tasks — tasks past their planned date
 * 3. Today tasks — tasks planned for today
 * 4. Tomorrow tasks — tasks planned for tomorrow
 * 5. Tasks without date — sorted by points DESC (excluding collected tasks already handled)
 * 6. Future tasks (day+2 or more) — sorted by date ASC
 */
export class TaskSorting {
  /**
   * Parse date string and normalize to UTC at midnight
   * This ensures consistent date handling across all environments (dev/prod, SQLite/PostgreSQL)
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
  static sortTasksByPriority(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1))
    const dayAfterTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2))

    return tasks
      .sort((a, b) => {
        // Parse dates and normalize to UTC at midnight
        const aDate = a.plannedDate ? TaskSorting.parseAndNormalizeDate(a.plannedDate) : null
        const bDate = b.plannedDate ? TaskSorting.parseAndNormalizeDate(b.plannedDate) : null

        const aIsOverdue = aDate && aDate < today
        const bIsOverdue = bDate && bDate < today
        const aIsToday = aDate && aDate.getTime() === today.getTime()
        const bIsToday = bDate && bDate.getTime() === today.getTime()
        const aIsTomorrow = aDate && aDate.getTime() === tomorrow.getTime()
        const bIsTomorrow = bDate && bDate.getTime() === tomorrow.getTime()
        const aIsFuture = aDate && aDate >= dayAfterTomorrow
        const bIsFuture = bDate && bDate >= dayAfterTomorrow

        // Check for collected tasks: either high priority (500+ points) OR new default tasks (importance=0, complexity=3)
        const aIsNewDefaultTask = a.importance === 0 && a.complexity === 3 && !aDate
        const bIsNewDefaultTask = b.importance === 0 && b.complexity === 3 && !bDate
        const aIsHighPriorityTask = a.points >= 500 && !aDate
        const bIsHighPriorityTask = b.points >= 500 && !bDate
        const aIsCollected = aIsNewDefaultTask || aIsHighPriorityTask
        const bIsCollected = bIsNewDefaultTask || bIsHighPriorityTask

        // 1. Collected tasks (new default tasks OR high priority tasks, only if no due date)
        if (aIsCollected && !bIsCollected) return -1
        if (!aIsCollected && bIsCollected) return 1
        if (aIsCollected && bIsCollected) {
          // Both are collected tasks, sort by points DESC, then creation date DESC
          if (a.points !== b.points) return b.points - a.points
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      .map((task) => ({
        ...task,
        subtasks: TaskSorting.sortSubtasksByPriority(task.subtasks)
      }))
  }

  /**
   * Sort subtasks by points
   */
  static sortSubtasksByPriority(subtasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    return subtasks
      .sort((a, b) => TaskSorting.compareByPoints(a, b))
      .map((subtask) => ({
        ...subtask,
        subtasks: TaskSorting.sortSubtasksByPriority(subtask.subtasks)
      }))
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   */
  static compareByPoints(a: TaskWithSubtasks, b: TaskWithSubtasks): number {
    // Sort by points DESC (higher points = higher priority)
    if (a.points !== b.points) {
      return b.points - a.points
    }

    // If points equal, sort by creation date DESC (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }
}