import { GenericTask } from '../entities/TaskTypes'

/**
 * Service for synchronizing parent task dates with their children's dates
 * When a parent has children, its plannedDate and dueDate should match the most urgent child
 */
export class ParentDateSyncService {
  /**
   * Calculate the dates that a parent task should have based on its children
   * Returns the most urgent (earliest) plannedDate and dueDate from children
   */
  static calculateParentDates<TDate extends Date | string>(
    children: GenericTask<TDate>[]
  ): {
    plannedDate: TDate | undefined
    dueDate: TDate | undefined
  } {
    if (children.length === 0) {
      return { plannedDate: undefined, dueDate: undefined }
    }

    // Filter out completed children for date calculations
    const activeChildren = children.filter(child => !child.isCompleted)

    if (activeChildren.length === 0) {
      return { plannedDate: undefined, dueDate: undefined }
    }

    // Find most urgent (earliest) plannedDate from active children
    const plannedDates = activeChildren
      .map(child => child.plannedDate)
      .filter((date): date is TDate => date !== undefined && date !== null)

    const mostUrgentPlannedDate = plannedDates.length > 0
      ? this.findEarliestDate(plannedDates)
      : undefined

    // Find most urgent (earliest) dueDate from active children
    const dueDates = activeChildren
      .map(child => child.dueDate)
      .filter((date): date is TDate => date !== undefined && date !== null)

    const mostUrgentDueDate = dueDates.length > 0
      ? this.findEarliestDate(dueDates)
      : undefined

    return {
      plannedDate: mostUrgentPlannedDate,
      dueDate: mostUrgentDueDate,
    }
  }

  /**
   * Find the earliest date from an array of dates
   * Works with both Date objects and ISO string dates
   */
  private static findEarliestDate<TDate extends Date | string>(dates: TDate[]): TDate {
    if (dates.length === 0) {
      throw new Error('Cannot find earliest date from empty array')
    }

    return dates.reduce((earliest, current) => {
      const earliestTime = earliest instanceof Date ? earliest.getTime() : new Date(earliest).getTime()
      const currentTime = current instanceof Date ? current.getTime() : new Date(current).getTime()
      return currentTime < earliestTime ? current : earliest
    })
  }

  /**
   * Check if parent dates need to be updated based on children
   */
  static shouldUpdateParentDates<TDate extends Date | string>(
    parent: GenericTask<TDate>,
    children: GenericTask<TDate>[]
  ): boolean {
    const calculatedDates = this.calculateParentDates(children)

    // Check if plannedDate needs update
    const plannedDateNeedsUpdate = !this.areDatesEqual(
      parent.plannedDate,
      calculatedDates.plannedDate
    )

    // Check if dueDate needs update
    const dueDateNeedsUpdate = !this.areDatesEqual(
      parent.dueDate,
      calculatedDates.dueDate
    )

    return plannedDateNeedsUpdate || dueDateNeedsUpdate
  }

  /**
   * Compare two dates for equality (handles undefined, null, Date objects, and strings)
   */
  private static areDatesEqual<TDate extends Date | string>(
    date1: TDate | undefined | null,
    date2: TDate | undefined | null
  ): boolean {
    // Both undefined or null
    if ((date1 === undefined || date1 === null) && (date2 === undefined || date2 === null)) {
      return true
    }

    // One is undefined/null, the other is not
    if ((date1 === undefined || date1 === null) || (date2 === undefined || date2 === null)) {
      return false
    }

    // Compare timestamps
    const time1 = date1 instanceof Date ? date1.getTime() : new Date(date1).getTime()
    const time2 = date2 instanceof Date ? date2.getTime() : new Date(date2).getTime()

    return time1 === time2
  }
}
