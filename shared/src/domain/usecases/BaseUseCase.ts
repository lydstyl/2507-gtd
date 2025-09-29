import { OperationResult, OperationResultUtils, AsyncOperationResult } from '../types/OperationResult'

export abstract class BaseUseCase<TRequest = unknown, TResponse = unknown> {
  abstract execute(request: TRequest): AsyncOperationResult<TResponse>

  protected success<T>(data?: T): OperationResult<T> {
    return OperationResultUtils.success(data)
  }

  protected failure<T = unknown>(
    message: string,
    code: string = 'OPERATION_ERROR',
    details?: unknown,
    field?: string,
    constraint?: string
  ): OperationResult<T> {
    return OperationResultUtils.failure(message, code, details, field, constraint)
  }

  protected validationFailure<T = unknown>(
    errors: string[],
    code: string = 'VALIDATION_ERROR'
  ): OperationResult<T> {
    return OperationResultUtils.validationFailure(errors, code)
  }

  protected async handleAsync<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<OperationResult<T>> {
    try {
      const result = await operation()
      return this.success(result)
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  protected handleError<T = unknown>(
    error: unknown,
    context: string = 'operation'
  ): OperationResult<T> {
    if (error instanceof Error) {
      // Check for specific error types that should be preserved
      if (error.message.includes('not found')) {
        return this.failure(error.message, 'NOT_FOUND')
      }

      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return this.failure(error.message, 'DUPLICATE_ERROR')
      }

      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        return this.failure(error.message, 'PERMISSION_ERROR')
      }

      return this.failure(`Failed to complete ${context}: ${error.message}`)
    }

    return this.failure(`Unknown error occurred during ${context}`)
  }

  protected validateRequired<T>(
    value: T | null | undefined,
    fieldName: string
  ): OperationResult<T> {
    if (value === null || value === undefined) {
      return this.failure(
        `${fieldName} is required`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'required'
      )
    }
    return this.success(value)
  }

  protected validateString(
    value: unknown,
    fieldName: string,
    options: {
      required?: boolean
      minLength?: number
      maxLength?: number
      pattern?: RegExp
    } = {}
  ): OperationResult<string> {
    if (options.required && (value === null || value === undefined)) {
      return this.failure(
        `${fieldName} is required`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'required'
      )
    }

    if (value === null || value === undefined) {
      return this.success(value as any)
    }

    if (typeof value !== 'string') {
      return this.failure(
        `${fieldName} must be a string`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'type'
      )
    }

    const trimmed = value.trim()

    if (options.minLength && trimmed.length < options.minLength) {
      return this.failure(
        `${fieldName} must be at least ${options.minLength} characters`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'minLength'
      )
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
      return this.failure(
        `${fieldName} must be no more than ${options.maxLength} characters`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'maxLength'
      )
    }

    if (options.pattern && !options.pattern.test(trimmed)) {
      return this.failure(
        `${fieldName} format is invalid`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'pattern'
      )
    }

    return this.success(trimmed)
  }

  protected validateNumber(
    value: unknown,
    fieldName: string,
    options: {
      required?: boolean
      min?: number
      max?: number
      integer?: boolean
    } = {}
  ): OperationResult<number> {
    if (options.required && (value === null || value === undefined)) {
      return this.failure(
        `${fieldName} is required`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'required'
      )
    }

    if (value === null || value === undefined) {
      return this.success(value as any)
    }

    if (typeof value !== 'number' || isNaN(value)) {
      return this.failure(
        `${fieldName} must be a valid number`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'type'
      )
    }

    if (options.integer && !Number.isInteger(value)) {
      return this.failure(
        `${fieldName} must be an integer`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'integer'
      )
    }

    if (options.min !== undefined && value < options.min) {
      return this.failure(
        `${fieldName} must be at least ${options.min}`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'min'
      )
    }

    if (options.max !== undefined && value > options.max) {
      return this.failure(
        `${fieldName} must be no more than ${options.max}`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'max'
      )
    }

    return this.success(value)
  }

  protected validateArray<T>(
    value: unknown,
    fieldName: string,
    options: {
      required?: boolean
      minLength?: number
      maxLength?: number
      itemValidator?: (item: unknown, index: number) => OperationResult<T>
    } = {}
  ): OperationResult<T[]> {
    if (options.required && (value === null || value === undefined)) {
      return this.failure(
        `${fieldName} is required`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'required'
      )
    }

    if (value === null || value === undefined) {
      return this.success(value as any)
    }

    if (!Array.isArray(value)) {
      return this.failure(
        `${fieldName} must be an array`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'type'
      )
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
      return this.failure(
        `${fieldName} must contain at least ${options.minLength} items`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'minLength'
      )
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      return this.failure(
        `${fieldName} must contain no more than ${options.maxLength} items`,
        'VALIDATION_ERROR',
        undefined,
        fieldName,
        'maxLength'
      )
    }

    if (options.itemValidator) {
      const validatedItems: T[] = []
      for (let i = 0; i < value.length; i++) {
        const itemResult = options.itemValidator(value[i], i)
        if (!itemResult.success) {
          return this.failure(
            `${fieldName}[${i}]: ${itemResult.error?.message || 'Invalid item'}`,
            'VALIDATION_ERROR',
            itemResult.error?.details,
            `${fieldName}[${i}]`,
            'item'
          )
        }
        validatedItems.push(itemResult.data!)
      }
      return this.success(validatedItems)
    }

    return this.success(value as T[])
  }
}