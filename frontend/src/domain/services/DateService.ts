export class DateService {
  /**
   * Format date string for display
   */
  static formatDate(dateString: string): string {
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
   * Check if date is overdue
   */
  static isOverdue(dateString: string): boolean {
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
   * Get day of week (0 = Sunday, 6 = Saturday)
   */
  static getDayOfWeek(dateString: string): number {
    try {
      const date = new Date(dateString)
      return date.getDay()
    } catch {
      return -1
    }
  }

  /**
   * Get date indicator with emoji and tooltip
   */
  static getDateIndicator(dateString: string) {
    const dayOfWeek = this.getDayOfWeek(dateString)

    if (dayOfWeek === 3) {
      return {
        icon: '🌿',
        tooltip: 'Mercredi',
        className: 'text-green-600'
      }
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        icon: '🏖️',
        tooltip: 'Week-end',
        className: 'text-orange-600'
      }
    }

    return null
  }

  /**
   * Format date for input field (YYYY-MM-DD)
   */
  static formatForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Get today's date formatted for input
   */
  static getTodayForInput(): string {
    return this.formatForInput(new Date())
  }

  /**
   * Get tomorrow's date formatted for input
   */
  static getTomorrowForInput(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return this.formatForInput(tomorrow)
  }

  /**
   * Get next week's date formatted for input
   */
  static getNextWeekForInput(): string {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return this.formatForInput(nextWeek)
  }

  /**
   * Parse date and ensure it's valid
   */
  static parseDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }

  /**
   * Get relative time string (e.g., "2 days ago", "in 3 days")
   */
  static getRelativeTime(dateString: string): string {
    const date = this.parseDate(dateString)
    if (!date) return 'Date invalide'

    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Aujourd'hui"
    if (diffInDays === 1) return 'Demain'
    if (diffInDays === -1) return 'Hier'
    if (diffInDays > 0) return `Dans ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
    if (diffInDays < 0) return `Il y a ${Math.abs(diffInDays)} jour${Math.abs(diffInDays) > 1 ? 's' : ''}`

    return this.formatDate(dateString)
  }

  /**
   * Get days until due date
   */
  static getDaysUntilDue(dateString: string): number {
    const date = this.parseDate(dateString)
    if (!date) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffInMs = date.getTime() - today.getTime()
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if date is within next N days
   */
  static isWithinDays(dateString: string, days: number): boolean {
    const daysUntil = this.getDaysUntilDue(dateString)
    return daysUntil >= 0 && daysUntil <= days
  }

  /**
   * Get week start date (Monday)
   */
  static getWeekStart(date: Date = new Date()): Date {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
    return new Date(date.setDate(diff))
  }

  /**
   * Get week end date (Sunday)
   */
  static getWeekEnd(date: Date = new Date()): Date {
    const weekStart = this.getWeekStart(new Date(date))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return weekEnd
  }

  /**
   * Check if date is this week
   */
  static isThisWeek(dateString: string): boolean {
    const date = this.parseDate(dateString)
    if (!date) return false

    const weekStart = this.getWeekStart()
    const weekEnd = this.getWeekEnd()

    return date >= weekStart && date <= weekEnd
  }

  /**
   * Get month name in French
   */
  static getMonthName(date: Date): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return months[date.getMonth()]
  }

  /**
   * Get day name in French
   */
  static getDayName(date: Date): string {
    const days = [
      'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
    ]
    return days[date.getDay()]
  }
}