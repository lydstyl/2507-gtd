import { BaseError } from './BaseError'

/**
 * Validation error for invalid domain data
 */
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400
  readonly isOperational = true

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Error when a requested resource is not found
 */
export class NotFoundError extends BaseError {
  readonly code = 'NOT_FOUND'
  readonly statusCode = 404
  readonly isOperational = true

  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(message, { resource, id })
  }
}

/**
 * Error when user is not authenticated
 */
export class UnauthorizedError extends BaseError {
  readonly code = 'UNAUTHORIZED'
  readonly statusCode = 401
  readonly isOperational = true

  constructor(message: string = 'User not authenticated') {
    super(message)
  }
}

/**
 * Error when user lacks permission for an action
 */
export class ForbiddenError extends BaseError {
  readonly code = 'FORBIDDEN'
  readonly statusCode = 403
  readonly isOperational = true

  constructor(message: string = 'Access denied') {
    super(message)
  }
}

/**
 * Error when a resource conflict occurs
 */
export class ConflictError extends BaseError {
  readonly code = 'CONFLICT'
  readonly statusCode = 409
  readonly isOperational = true

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Internal server error for unexpected failures
 */
export class InternalServerError extends BaseError {
  readonly code = 'INTERNAL_SERVER_ERROR'
  readonly statusCode = 500
  readonly isOperational = false

  constructor(message: string = 'Internal server error', context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Error for business rule violations
 */
export class BusinessRuleError extends BaseError {
  readonly code = 'BUSINESS_RULE_VIOLATION'
  readonly statusCode = 422
  readonly isOperational = true

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context)
  }
}

/**
 * Error for invalid task data
 */
export class TaskValidationError extends BaseError {
  readonly code = 'TASK_VALIDATION_ERROR'
  readonly statusCode = 400
  readonly isOperational = true

  constructor(field: string, value: unknown, constraint: string) {
    super(`Invalid task ${field}: ${constraint}`, { field, value, constraint })
  }
}

/**
 * Error for invalid tag data
 */
export class TagValidationError extends BaseError {
  readonly code = 'TAG_VALIDATION_ERROR'
  readonly statusCode = 400
  readonly isOperational = true

  constructor(field: string, value: unknown, constraint: string) {
    super(`Invalid tag ${field}: ${constraint}`, { field, value, constraint })
  }
}

/**
 * Error for CSV import/export operations
 */
export class CsvError extends BaseError {
  readonly code = 'CSV_ERROR'
  readonly statusCode = 400
  readonly isOperational = true

  constructor(message: string, line?: number, context?: Record<string, unknown>) {
    const fullMessage = line ? `Line ${line}: ${message}` : message
    super(fullMessage, { line, ...context })
  }
}