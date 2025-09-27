import { GenericTaskWithSubtasks, TaskCategory, DateContext } from '../entities/TaskTypes'
import { normalizeDate, createDateContext } from '../utils/DateUtils'

/**
 * Pure business logic for task prioritization and categorization
 * Generic implementation that works with both Date objects and string dates
 * Contains no infrastructure concerns - only domain rules
 */
export class TaskPriorityService {
  /**
   * Create normalized date context for consistent comparisons
   */
  static createDateContext(): DateContext {
    return createDateContext()
  }

  /**
   * Normalize a date to UTC midnight for consistent comparisons
   */
  static normalizeDate(dateInput: string | Date): Date {
    return normalizeDate(dateInput)
  }

  /**
   * Determine if a date is urgent (within 2 days from today)
   */
  static isDateUrgent(dateInput: string | Date, context: DateContext): boolean {
    try {
      const date = this.normalizeDate(dateInput)
      return date < context.dayAfterTomorrow
    } catch {
      return false
    }
  }

  /**
   * Get the effective date for a task: use due date if urgent, otherwise planned date
   */
  static getEffectiveDate<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): Date | null {
    if (task.dueDate && this.isDateUrgent(task.dueDate, context)) {
      return this.normalizeDate(task.dueDate)
    }
    return task.plannedDate ? this.normalizeDate(task.plannedDate) : null
  }

  /**
   * Check if a task is a collected task (business rule)
   * Collected tasks are either:
   * 1. New default tasks: importance=0, complexity=3, no effective date
   * 2. High priority tasks: 500+ points, no effective date
   */
  static isCollectedTask<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): boolean {
    const effectiveDate = this.getEffectiveDate(task, context)

    // Only consider as collected if no effective date (no planned date and no urgent due date)
    if (effectiveDate) return false

    // New default tasks: importance=0, complexity=3
    const isNewDefaultTask = task.importance === 0 && task.complexity === 3

    // Legacy high priority tasks: 500+ points
    const isHighPriorityTask = task.points >= 500

    return isNewDefaultTask || isHighPriorityTask
  }

  /**
   * Check if a task is overdue based on effective date
   */
  static isOverdueTask<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): boolean {
    const effectiveDate = this.getEffectiveDate(task, context)
    return effectiveDate ? effectiveDate < context.today : false
  }

  /**
   * Check if a task is due today based on effective date
   */
  static isTodayTask<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): boolean {
    const effectiveDate = this.getEffectiveDate(task, context)
    return effectiveDate ? effectiveDate.getTime() === context.today.getTime() : false
  }

  /**
   * Check if a task is due tomorrow based on effective date
   */
  static isTomorrowTask<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): boolean {
    const effectiveDate = this.getEffectiveDate(task, context)
    return effectiveDate ? effectiveDate.getTime() === context.tomorrow.getTime() : false
  }

  /**
   * Check if a task is future (day+2 or more) based on effective date
   */
  static isFutureTask<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): boolean {
    const effectiveDate = this.getEffectiveDate(task, context)
    return effectiveDate ? effectiveDate >= context.dayAfterTomorrow : false
  }

  /**
   * Get the category of a task based on business rules
   */
  static getTaskCategory<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): TaskCategory {
    // 1. Collected tasks (new default tasks OR high priority tasks, only if no effective date)
    if (this.isCollectedTask(task, context)) {
      return 'collected'
    }

    // 2. Overdue tasks
    if (this.isOverdueTask(task, context)) {
      return 'overdue'
    }

    // 3. Today tasks
    if (this.isTodayTask(task, context)) {
      return 'today'
    }

    // 4. Tomorrow tasks
    if (this.isTomorrowTask(task, context)) {
      return 'tomorrow'
    }

    // 5. Future tasks (day+2 or more)
    if (this.isFutureTask(task, context)) {
      return 'future'
    }

    // 6. Tasks without effective date (excluding collected tasks already handled)
    return 'no-date'
  }

  /**
   * Get priority order for categories (lower number = higher priority)
   */
  static getCategoryPriority(category: TaskCategory): number {
    const priorities = {
      collected: 1,
      overdue: 2,
      today: 3,
      tomorrow: 4,
      'no-date': 5,
      future: 6
    }
    return priorities[category]
  }

  /**
   * Compare two tasks by category priority
   */
  static compareByCategory<TDate extends string | Date>(
    a: GenericTaskWithSubtasks<TDate>,
    b: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): number {
    const categoryA = this.getTaskCategory(a, context)
    const categoryB = this.getTaskCategory(b, context)

    const priorityA = this.getCategoryPriority(categoryA)
    const priorityB = this.getCategoryPriority(categoryB)

    return priorityA - priorityB
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   */
  static compareByPoints<TDate extends string | Date>(
    a: GenericTaskWithSubtasks<TDate>,
    b: GenericTaskWithSubtasks<TDate>
  ): number {
    if (a.points !== b.points) {
      return b.points - a.points
    }
    // If points equal, sort by creation date DESC (newer first)
    try {
      const dateA = new Date(a.createdAt as string | number | Date)
      const dateB = new Date(b.createdAt as string | number | Date)
      return dateB.getTime() - dateA.getTime()
    } catch {
      // If date parsing fails, consider them equal
      return 0
    }
  }

  /**
   * Compare two tasks by effective date (ascending)
   */
  static compareByEffectiveDate<TDate extends string | Date>(
    a: GenericTaskWithSubtasks<TDate>,
    b: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): number {
    const dateA = this.getEffectiveDate(a, context)
    const dateB = this.getEffectiveDate(b, context)

    if (!dateA && dateB) return 1
    if (dateA && !dateB) return -1
    if (!dateA && !dateB) return 0

    // Both dates exist at this point
    return dateA!.getTime() - dateB!.getTime()
  }

  /**
   * Get the complete sorting comparison between two tasks
   * This implements the full business logic for task prioritization
   */
  static compareTasksPriority<TDate extends string | Date>(
    a: GenericTaskWithSubtasks<TDate>,
    b: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): number {
    const categoryA = this.getTaskCategory(a, context)

    // First, compare by category
    const categoryComparison = this.compareByCategory(a, b, context)
    if (categoryComparison !== 0) return categoryComparison

    // Within same category, apply specific sorting rules
    switch (categoryA) {
      case 'collected':
        // Both are collected tasks, sort by points DESC, then creation date DESC
        return this.compareByPoints(a, b)

      case 'overdue':
        // Both overdue, sort by date ASC (oldest overdue first), then points DESC
        const dateComparison = this.compareByEffectiveDate(a, b, context)
        if (dateComparison !== 0) return dateComparison
        return this.compareByPoints(a, b)

      case 'today':
      case 'tomorrow':
        // Both due same day, sort by points DESC
        return this.compareByPoints(a, b)

      case 'no-date':
        // Both have no date, sort by points DESC
        return this.compareByPoints(a, b)

      case 'future':
        // Both are future tasks, sort by date ASC, then points DESC
        const futureDateComparison = this.compareByEffectiveDate(a, b, context)
        if (futureDateComparison !== 0) return futureDateComparison
        return this.compareByPoints(a, b)

      default:
        // Fallback: sort by points DESC
        return this.compareByPoints(a, b)
    }
  }
}