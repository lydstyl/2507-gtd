/**
 * Shared filtering utilities for complex filtering operations
 */

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'between'
  | 'isNull'
  | 'isNotNull'

export interface FilterCondition<T = any> {
  /**
   * Field name to filter on
   */
  field: string
  /**
   * Filter operator
   */
  operator: FilterOperator
  /**
   * Value(s) to compare against
   */
  value?: T | T[]
}

export interface FilterGroup {
  /**
   * Logic operator for combining conditions
   */
  logic: 'and' | 'or'
  /**
   * Filter conditions in this group
   */
  conditions: FilterCondition[]
  /**
   * Nested filter groups
   */
  groups?: FilterGroup[]
}

export class FilterUtils {
  /**
   * Get nested property value from object
   */
  static getNestedValue<T>(obj: T, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj as any)
  }

  /**
   * Check if value matches condition
   */
  static matchesCondition<T>(item: T, condition: FilterCondition): boolean {
    const { field, operator, value } = condition
    const itemValue = this.getNestedValue(item, field)

    switch (operator) {
      case 'equals':
        return itemValue === value

      case 'notEquals':
        return itemValue !== value

      case 'contains':
        if (typeof itemValue === 'string' && typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase())
        }
        if (Array.isArray(itemValue)) {
          return itemValue.includes(value)
        }
        return false

      case 'startsWith':
        return typeof itemValue === 'string' && typeof value === 'string'
          ? itemValue.toLowerCase().startsWith(value.toLowerCase())
          : false

      case 'endsWith':
        return typeof itemValue === 'string' && typeof value === 'string'
          ? itemValue.toLowerCase().endsWith(value.toLowerCase())
          : false

      case 'greaterThan':
        return itemValue > value

      case 'greaterThanOrEqual':
        return itemValue >= value

      case 'lessThan':
        return itemValue < value

      case 'lessThanOrEqual':
        return itemValue <= value

      case 'in':
        return Array.isArray(value) ? value.includes(itemValue) : false

      case 'notIn':
        return Array.isArray(value) ? !value.includes(itemValue) : true

      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          const [min, max] = value
          return itemValue >= min && itemValue <= max
        }
        return false

      case 'isNull':
        return itemValue === null || itemValue === undefined

      case 'isNotNull':
        return itemValue !== null && itemValue !== undefined

      default:
        return false
    }
  }

  /**
   * Check if item matches filter group
   */
  static matchesGroup<T>(item: T, group: FilterGroup): boolean {
    const { logic, conditions, groups = [] } = group

    // Check conditions
    const conditionResults = conditions.map(condition =>
      this.matchesCondition(item, condition)
    )

    // Check nested groups
    const groupResults = groups.map(nestedGroup =>
      this.matchesGroup(item, nestedGroup)
    )

    const allResults = [...conditionResults, ...groupResults]

    if (logic === 'and') {
      return allResults.every(result => result)
    } else {
      return allResults.some(result => result)
    }
  }

  /**
   * Filter array by single condition
   */
  static filterByCondition<T>(items: T[], condition: FilterCondition): T[] {
    return items.filter(item => this.matchesCondition(item, condition))
  }

  /**
   * Filter array by filter group
   */
  static filterByGroup<T>(items: T[], group: FilterGroup): T[] {
    return items.filter(item => this.matchesGroup(item, group))
  }

  /**
   * Filter array by multiple conditions (AND logic)
   */
  static filterByConditions<T>(items: T[], conditions: FilterCondition[]): T[] {
    return this.filterByGroup(items, {
      logic: 'and',
      conditions
    })
  }

  /**
   * Create a simple equals filter
   */
  static createEqualsFilter(field: string, value: any): FilterCondition {
    return { field, operator: 'equals', value }
  }

  /**
   * Create a contains filter (for text search)
   */
  static createContainsFilter(field: string, value: string): FilterCondition {
    return { field, operator: 'contains', value }
  }

  /**
   * Create a range filter (between)
   */
  static createRangeFilter(field: string, min: any, max: any): FilterCondition {
    return { field, operator: 'between', value: [min, max] }
  }

  /**
   * Create a text search filter across multiple fields
   */
  static createMultiFieldSearch(fields: string[], searchText: string): FilterGroup {
    return {
      logic: 'or',
      conditions: fields.map(field => this.createContainsFilter(field, searchText))
    }
  }
}