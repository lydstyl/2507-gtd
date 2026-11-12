/**
 * Keeps the two dates of a task coherent.
 *
 * A task has a planned date ("date prévue" — when you intend to work on it)
 * and a due date ("date limite" — the hard deadline). The deadline can never
 * be earlier than the planned date: a task planned for a given day cannot be
 * due before that day.
 *
 * Business rule (demande Gabriel, 11/2026): when a task has dueDate < plannedDate
 * and its plannedDate is changed, the dueDate is realigned on the new plannedDate.
 */

export type DateInput = Date | string | null | undefined

export class TaskDateConsistencyService {
  /**
   * Parse a date input into a comparable Date.
   * Returns null when the input is absent, empty or invalid.
   */
  static parseDate(value: DateInput): Date | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string' && value.trim() === '') return null
    const date = typeof value === 'string' ? new Date(value) : value
    return isNaN(date.getTime()) ? null : date
  }

  /**
   * Comparison at calendar-day precision (UTC day), so a time component or a
   * timezone offset can never flip the verdict: a task due and planned on the
   * same day is considered coherent.
   */
  static toDayIndex(value: DateInput): number | null {
    const date = TaskDateConsistencyService.parseDate(value)
    if (!date) return null
    return Math.floor(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000
    )
  }

  /**
   * True only when both dates exist and dueDate is strictly before plannedDate.
   * Missing or invalid dates are never considered "before".
   */
  static isDueDateBeforePlannedDate(plannedDate: DateInput, dueDate: DateInput): boolean {
    const plannedDay = TaskDateConsistencyService.toDayIndex(plannedDate)
    const dueDay = TaskDateConsistencyService.toDayIndex(dueDate)
    if (plannedDay === null || dueDay === null) return false
    return dueDay < plannedDay
  }

  /**
   * Returns the due date to persist once plannedDate has changed:
   * - no due date → unchanged (an absent deadline is not invented)
   * - dueDate >= plannedDate → unchanged
   * - dueDate < plannedDate → plannedDate (the deadline is realigned)
   *
   * Works with both Date objects and YYYY-MM-DD / ISO strings, and gives the
   * result back in the same type it received.
   */
  static alignDueDateWithPlannedDate<TDate extends Date | string>(
    plannedDate: TDate | null | undefined,
    dueDate: TDate | null | undefined
  ): TDate | null | undefined {
    if (!TaskDateConsistencyService.isDueDateBeforePlannedDate(plannedDate, dueDate)) {
      return dueDate
    }

    // The realigned value is the planned date, in its original representation
    if (typeof plannedDate === 'string') {
      const due = dueDate as Date | string | null | undefined
      const dueIsDateOnly = typeof due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(due)
      return (dueIsDateOnly ? plannedDate.slice(0, 10) : plannedDate) as TDate
    }

    return plannedDate
  }
}
