/**
 * Shared repository query and filter types
 * Used to standardize query patterns across frontend and backend
 */

/**
 * Query options for pagination, sorting, and filtering
 */
export interface QueryOptions {
  /**
   * Limit the number of results
   */
  limit?: number
  /**
   * Skip/offset for pagination
   */
  offset?: number
  /**
   * Sort field and direction
   */
  sort?: SortOptions
}

/**
 * Sorting options for query results
 */
export interface SortOptions {
  /**
   * Field to sort by
   */
  field: string
  /**
   * Sort direction
   */
  direction: 'asc' | 'desc'
}

/**
 * Search criteria for text-based queries
 */
export interface SearchCriteria {
  /**
   * Search query string
   */
  query: string
  /**
   * Fields to search in
   */
  fields?: string[]
}

// Note: TaskFilters and TagFilters are now defined in their respective entity type files
// (TaskTypes.ts and TagTypes.ts) to avoid duplication

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  /**
   * Number of items successfully processed
   */
  successCount: number
  /**
   * Number of items that failed
   */
  failureCount: number
  /**
   * Error messages for failed items
   */
  errors: string[]
}

/**
 * Completion statistics
 */
export interface CompletionStats {
  dailyCompletions: { date: string; count: number; tasks: { id: string; name: string }[] }[]
  weeklyCompletions: { weekStart: string; count: number }[]
}