/**
 * Date utility functions for handling both Date objects and string dates
 */

/**
 * Normalize a date input to UTC midnight for consistent comparisons
 * Works with both Date objects and string dates
 */
export function normalizeDate(dateInput: string | Date): Date {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

/**
 * Convert a date to string format (ISO string)
 */
export function dateToString(date: Date): string {
  return date.toISOString()
}

/**
 * Convert a string to Date object
 */
export function stringToDate(dateStr: string): Date {
  return new Date(dateStr)
}

/**
 * Check if a date input is urgent (within specified days from today)
 */
export function isDateUrgent(dateInput: string | Date, daysThreshold: number = 2): boolean {
  try {
    const date = normalizeDate(dateInput)
    const now = new Date()
    const threshold = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysThreshold))
    return date < threshold
  } catch {
    return false
  }
}

/**
 * Create normalized date context for consistent comparisons
 */
export function createDateContext() {
  const now = new Date()
  return {
    today: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
    tomorrow: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
    dayAfterTomorrow: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2))
  }
}

/**
 * Compare two dates (works with both Date objects and strings)
 */
export function compareDates(a: string | Date, b: string | Date): number {
  const dateA = normalizeDate(a)
  const dateB = normalizeDate(b)
  return dateA.getTime() - dateB.getTime()
}