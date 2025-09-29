/**
 * Shared pagination utilities for consistent pagination across frontend and backend
 */

export interface PaginationParams {
  /**
   * Current page number (1-indexed)
   */
  page: number
  /**
   * Number of items per page
   */
  pageSize: number
}

export interface PaginationResult<T> {
  /**
   * Items for the current page
   */
  items: T[]
  /**
   * Current page number
   */
  page: number
  /**
   * Items per page
   */
  pageSize: number
  /**
   * Total number of items
   */
  totalItems: number
  /**
   * Total number of pages
   */
  totalPages: number
  /**
   * Whether there is a previous page
   */
  hasPrevious: boolean
  /**
   * Whether there is a next page
   */
  hasNext: boolean
}

export interface OffsetLimitParams {
  /**
   * Number of items to skip
   */
  offset: number
  /**
   * Maximum number of items to return
   */
  limit: number
}

export class PaginationUtils {
  /**
   * Calculate offset and limit from page and pageSize
   */
  static toOffsetLimit(params: PaginationParams): OffsetLimitParams {
    const { page, pageSize } = params
    return {
      offset: (page - 1) * pageSize,
      limit: pageSize
    }
  }

  /**
   * Calculate page number from offset and limit
   */
  static toPage(offset: number, limit: number): number {
    return Math.floor(offset / limit) + 1
  }

  /**
   * Create a pagination result
   */
  static createResult<T>(
    items: T[],
    params: PaginationParams,
    totalItems: number
  ): PaginationResult<T> {
    const { page, pageSize } = params
    const totalPages = Math.ceil(totalItems / pageSize)

    return {
      items,
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages
    }
  }

  /**
   * Paginate an array in memory
   */
  static paginate<T>(
    items: T[],
    params: PaginationParams
  ): PaginationResult<T> {
    const { offset, limit } = this.toOffsetLimit(params)
    const paginatedItems = items.slice(offset, offset + limit)
    return this.createResult(paginatedItems, params, items.length)
  }

  /**
   * Validate pagination parameters
   */
  static validate(params: PaginationParams): { valid: boolean; error?: string } {
    if (params.page < 1) {
      return { valid: false, error: 'Page must be greater than 0' }
    }
    if (params.pageSize < 1) {
      return { valid: false, error: 'Page size must be greater than 0' }
    }
    if (params.pageSize > 1000) {
      return { valid: false, error: 'Page size cannot exceed 1000' }
    }
    return { valid: true }
  }

  /**
   * Get default pagination params
   */
  static getDefaults(): PaginationParams {
    return {
      page: 1,
      pageSize: 50
    }
  }
}