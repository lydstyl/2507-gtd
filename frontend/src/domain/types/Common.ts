// Core domain types

export interface DomainError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterOptions {
  search?: string
  tags?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
}

export interface OperationResult<T = void> {
  success: boolean
  data?: T
  error?: DomainError
}

export interface AsyncOperationResult<T = void> extends OperationResult<T> {
  loading: boolean
}