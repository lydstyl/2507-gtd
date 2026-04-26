import { GenericTaskWithSubtasks, TaskCategory, DateContext, TaskStatus } from '../entities/TaskTypes'
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
    * Calculate points based on importance and complexity
    */
   static calculatePoints(importance: number, complexity: number): number {
     if (complexity === 0) return 0
     return Math.round(10 * importance / complexity)
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
   * Check if a task is a collected task (based on status field)
   */
  static isCollectedTask<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    _context: DateContext
  ): boolean {
    return (task as any).status === 'collecte'
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
   * Get the category of a task based on business rules.
   *
   * Status rules:
   * - brouillon → always 'brouillon' (dates ignored)
   * - pour_ia → always 'pour-ia' (dates ignored)
   * - collecte → always 'collected' (dates ignored)
   * - pret → categorized by date into 'pret-*' categories
   * - un_jour_peut_etre → always 'un-jour' (dates ignored)
   */
  static getTaskCategory<TDate extends string | Date>(
    task: GenericTaskWithSubtasks<TDate>,
    context: DateContext
  ): TaskCategory {
    const status = (task as any).status as TaskStatus | undefined

    if (status === 'brouillon') return 'brouillon'
    if (status === 'pour_ia') return 'pour-ia'
    if (status === 'collecte') return 'collected'
    if (status === 'un_jour_peut_etre') return 'un-jour'

    // 'pret' status tasks are categorized by date
    if (status === 'pret') {
      if (this.isOverdueTask(task, context)) return 'pret-overdue'
      if (this.isTodayTask(task, context)) return 'pret-today'
      if (this.isTomorrowTask(task, context)) return 'pret-tomorrow'
      if (this.isFutureTask(task, context)) return 'pret-future'
      return 'pret-no-date'
    }

    // Fallback for undefined/legacy status: treat as 'pret' (date-based categorization)
    if (this.isOverdueTask(task, context)) return 'pret-overdue'
    if (this.isTodayTask(task, context)) return 'pret-today'
    if (this.isTomorrowTask(task, context)) return 'pret-tomorrow'
    if (this.isFutureTask(task, context)) return 'pret-future'

    return 'pret-no-date'
  }

  /**
   * Get priority order for categories (lower number = higher priority)
   */
  static getCategoryPriority(category: TaskCategory): number {
    const priorities: Record<TaskCategory, number> = {
      brouillon: 1,
      'pour-ia': 2,
      collected: 3,
      'pret-overdue': 4,
      'pret-today': 5,
      'pret-tomorrow': 6,
      'pret-no-date': 7,
      'pret-future': 8,
      'un-jour': 9
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
   * Compare two tasks by importance DESC (higher importance = higher priority)
   */
  static compareByImportance<TDate extends string | Date>(
    a: GenericTaskWithSubtasks<TDate>,
    b: GenericTaskWithSubtasks<TDate>
  ): number {
    if (a.importance !== b.importance) {
      return b.importance - a.importance
    }
    // Tiebreaker: creation date DESC (newer first)
    try {
      const dateA = new Date(a.createdAt as string | number | Date)
      const dateB = new Date(b.createdAt as string | number | Date)
      return dateB.getTime() - dateA.getTime()
    } catch {
      return 0
    }
  }

  /**
   * Compare two tasks by points (higher points = higher priority)
   * @deprecated Use compareByImportance instead
   */
  static compareByPoints<TDate extends string | Date>(
    a: GenericTaskWithSubtasks<TDate>,
    b: GenericTaskWithSubtasks<TDate>
  ): number {
    return this.compareByImportance(a, b)
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
      case 'brouillon':
      case 'pour-ia':
      case 'collected':
      case 'pret-no-date':
      case 'un-jour':
        // Sort by importance only
        return this.compareByImportance(a, b)

      case 'pret-overdue':
        // Sort by date ASC (oldest first), then importance
        const overdueDateComparison = this.compareByEffectiveDate(a, b, context)
        if (overdueDateComparison !== 0) return overdueDateComparison
        return this.compareByImportance(a, b)

      case 'pret-today':
      case 'pret-tomorrow':
        // Sort by importance only
        return this.compareByImportance(a, b)

      case 'pret-future':
        // Sort by date ASC, then importance
        const futureDateComparison = this.compareByEffectiveDate(a, b, context)
        if (futureDateComparison !== 0) return futureDateComparison
        return this.compareByImportance(a, b)

      default:
        return this.compareByImportance(a, b)
    }
  }
}
