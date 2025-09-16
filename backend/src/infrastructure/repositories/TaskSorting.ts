import { TaskWithSubtasks } from '../../domain/entities/Task'

/**
 * New points-based sorting system implementation
 * Sorting rules (deterministic order):
 * 1. Collection tasks first — tasks with isCollection=true
 * 2. Today & Tomorrow — tasks due today or tomorrow, sorted by points DESC
 * 3. No due date — tasks without due_date, sorted by points DESC
 * 4. Future dated tasks — tasks with dates beyond tomorrow, sorted by due_date ASC, then points DESC
 */
export class TaskSorting {
  /**
   * Sort tasks according to the new points-based system
   */
  static sortTasksByPriority(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    return tasks
      .sort((a, b) => {
        // 1. Collection tasks first
        if (a.isCollection && !b.isCollection) return -1
        if (!a.isCollection && b.isCollection) return 1
        if (a.isCollection && b.isCollection) {
          // Within collection tasks, sort by points DESC
          return b.points - a.points
        }

        const aDate = a.dueDate ? new Date(a.dueDate) : null
        const bDate = b.dueDate ? new Date(b.dueDate) : null

        const aIsToday = aDate && aDate.toDateString() === today.toDateString()
        const bIsToday = bDate && bDate.toDateString() === today.toDateString()
        const aIsTomorrow = aDate && aDate.toDateString() === tomorrow.toDateString()
        const bIsTomorrow = bDate && bDate.toDateString() === tomorrow.toDateString()
        const aIsTodayOrTomorrow = aIsToday || aIsTomorrow
        const bIsTodayOrTomorrow = bIsToday || bIsTomorrow

        // 2. Today & Tomorrow tasks (by points DESC)
        if (aIsTodayOrTomorrow && !bIsTodayOrTomorrow) return -1
        if (!aIsTodayOrTomorrow && bIsTodayOrTomorrow) return 1
        if (aIsTodayOrTomorrow && bIsTodayOrTomorrow) {
          // Today before tomorrow
          if (aIsToday && bIsTomorrow) return -1
          if (aIsTomorrow && bIsToday) return 1
          // Same day group, sort by points DESC
          return b.points - a.points
        }

        // 3. No due date tasks (by points DESC)
        if (!aDate && bDate) return -1
        if (aDate && !bDate) return 1
        if (!aDate && !bDate) {
          return b.points - a.points
        }

        // 4. Future tasks (by date ASC, then points DESC)
        const dateComparison = aDate!.getTime() - bDate!.getTime()
        if (dateComparison !== 0) return dateComparison
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