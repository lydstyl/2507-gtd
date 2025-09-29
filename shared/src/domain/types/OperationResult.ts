/**
 * Shared operation result interface for consistent error handling across use cases
 */

export interface OperationError {
  code: string
  message: string
  details?: unknown
  field?: string
  constraint?: string
}

export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: OperationError
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Helper type for async operations
export type AsyncOperationResult<T = unknown> = Promise<OperationResult<T>>

// Helper functions for creating operation results
export class OperationResultUtils {
  static success<T>(data?: T): OperationResult<T> {
    return {
      success: true,
      data
    }
  }

  static failure<T = unknown>(
    message: string,
    code: string = 'OPERATION_ERROR',
    details?: unknown,
    field?: string,
    constraint?: string
  ): OperationResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        field,
        constraint
      }
    }
  }

  static validationFailure<T = unknown>(
    validationErrors: string[],
    code: string = 'VALIDATION_ERROR'
  ): OperationResult<T> {
    return {
      success: false,
      error: {
        code,
        message: validationErrors.join(', '),
        details: validationErrors
      }
    }
  }

  static fromValidationResult<T = unknown>(
    validation: ValidationResult,
    code: string = 'VALIDATION_ERROR'
  ): OperationResult<T> | null {
    if (validation.isValid) {
      return null // No error
    }

    return this.validationFailure<T>(validation.errors, code)
  }
}