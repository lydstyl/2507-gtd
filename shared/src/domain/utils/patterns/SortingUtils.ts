/**
 * Shared sorting utilities for multi-field sorting across frontend and backend
 */

export type SortDirection = 'asc' | 'desc'

export interface SortField {
  /**
   * Field name to sort by
   */
  field: string
  /**
   * Sort direction
   */
  direction: SortDirection
}

export interface SortOptions {
  /**
   * Primary sort field
   */
  primary: SortField
  /**
   * Secondary sort fields (fallback sorting)
   */
  secondary?: SortField[]
}

export class SortingUtils {
  /**
   * Compare two values for sorting
   */
  static compare<T>(a: T, b: T, direction: SortDirection = 'asc'): number {
    if (a === b) return 0

    // Handle null/undefined
    if (a === null || a === undefined) return direction === 'asc' ? 1 : -1
    if (b === null || b === undefined) return direction === 'asc' ? -1 : 1

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      const result = a.getTime() - b.getTime()
      return direction === 'asc' ? result : -result
    }

    // Handle strings
    if (typeof a === 'string' && typeof b === 'string') {
      const result = a.localeCompare(b)
      return direction === 'asc' ? result : -result
    }

    // Handle numbers and other types
    const result = a < b ? -1 : 1
    return direction === 'asc' ? result : -result
  }

  /**
   * Get nested property value from object
   */
  static getNestedValue<T>(obj: T, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj as any)
  }

  /**
   * Sort array by single field
   */
  static sortByField<T>(
    items: T[],
    field: string,
    direction: SortDirection = 'asc'
  ): T[] {
    return [...items].sort((a, b) => {
      const aValue = this.getNestedValue(a, field)
      const bValue = this.getNestedValue(b, field)
      return this.compare(aValue, bValue, direction)
    })
  }

  /**
   * Sort array by multiple fields (with fallback)
   */
  static sortByMultipleFields<T>(items: T[], sortOptions: SortOptions): T[] {
    const { primary, secondary = [] } = sortOptions
    const allFields = [primary, ...secondary]

    return [...items].sort((a, b) => {
      for (const { field, direction } of allFields) {
        const aValue = this.getNestedValue(a, field)
        const bValue = this.getNestedValue(b, field)
        const comparison = this.compare(aValue, bValue, direction)

        // If values are different, return the comparison result
        if (comparison !== 0) return comparison

        // If values are equal, continue to next sort field
      }

      return 0
    })
  }

  /**
   * Parse sort string (e.g., "name:asc" or "-createdAt")
   */
  static parseSortString(sortString: string): SortField {
    // Handle "-field" format (descending)
    if (sortString.startsWith('-')) {
      return {
        field: sortString.slice(1),
        direction: 'desc'
      }
    }

    // Handle "field:direction" format
    if (sortString.includes(':')) {
      const [field, direction] = sortString.split(':')
      return {
        field,
        direction: (direction as SortDirection) || 'asc'
      }
    }

    // Default to ascending
    return {
      field: sortString,
      direction: 'asc'
    }
  }

  /**
   * Parse multiple sort strings
   */
  static parseMultipleSorts(sortStrings: string[]): SortOptions | null {
    if (sortStrings.length === 0) return null

    const [primaryString, ...secondaryStrings] = sortStrings

    return {
      primary: this.parseSortString(primaryString),
      secondary: secondaryStrings.length > 0
        ? secondaryStrings.map(s => this.parseSortString(s))
        : undefined
    }
  }

  /**
   * Create a stable sort comparator function
   */
  static createComparator<T>(sortOptions: SortOptions): (a: T, b: T) => number {
    return (a, b) => {
      const { primary, secondary = [] } = sortOptions
      const allFields = [primary, ...secondary]

      for (const { field, direction } of allFields) {
        const aValue = this.getNestedValue(a, field)
        const bValue = this.getNestedValue(b, field)
        const comparison = this.compare(aValue, bValue, direction)

        if (comparison !== 0) return comparison
      }

      return 0
    }
  }
}