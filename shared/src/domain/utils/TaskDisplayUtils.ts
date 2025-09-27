/**
 * Utility functions for task display formatting
 * Contains presentation logic for dates, formatting, etc.
 */

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return 'Date invalide'
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const tomorrowOnly = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    )

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Aujourd'hui"
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return 'Date invalide'
  }
}

/**
 * Check if a date string represents an overdue date
 */
export function isOverdue(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  } catch {
    return false
  }
}

/**
 * Check if a due date is urgent (within 3 days)
 */
export function isDueDateUrgent(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate date + 3 days from today
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    // Check if due date is within the next 3 days (including today)
    return date <= threeDaysFromNow
  } catch {
    return false
  }
}

/**
 * Get day of week from date string
 */
export function getDayOfWeek(dateString: string): number {
  try {
    const date = new Date(dateString)
    return date.getDay()
  } catch {
    return -1
  }
}