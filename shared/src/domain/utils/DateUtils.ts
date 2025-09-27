/**
 * Date utility functions for handling both Date objects and string dates
 */

/**
 * Normalize a date input to UTC midnight for consistent comparisons
 * Works with both Date objects and string dates
 */
export function normalizeDate(dateInput: string | Date): Date {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Convert a date to string format (ISO string)
 */
export function dateToString(date: Date): string {
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  return date.toISOString()
}

/**
 * Convert a string to Date object
 */
export function stringToDate(dateStr: string): Date {
  return new Date(dateStr)
}

/**
 * Check if a date input is urgent (within specified days from today, future dates only)
 */
export function isDateUrgent(dateInput: string | Date, daysThreshold: number = 2, currentDate?: Date): boolean {
  try {
    const date = normalizeDate(dateInput)
    const now = currentDate || new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const threshold = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysThreshold))
    return date.getTime() >= today.getTime() && date.getTime() < threshold.getTime()
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
    today: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
    tomorrow: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)),
    dayAfterTomorrow: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2))
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