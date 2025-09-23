import { OperationResult } from '../../domain/types/Common'

// Base interface for all use cases
export interface UseCase<TRequest = void, TResponse = void> {
  execute(request: TRequest): Promise<OperationResult<TResponse>>
}

// Synchronous use case for simple operations
export interface SyncUseCase<TRequest = void, TResponse = void> {
  execute(request: TRequest): OperationResult<TResponse>
}

// Query use case for read operations
export interface QueryUseCase<TRequest = void, TResponse = void> {
  execute(request: TRequest): Promise<OperationResult<TResponse>>
}

// Command use case for write operations
export interface CommandUseCase<TRequest = void, TResponse = void> {
  execute(request: TRequest): Promise<OperationResult<TResponse>>
}

// Base implementation for use cases
export abstract class BaseUseCase<TRequest = void, TResponse = void> implements UseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<OperationResult<TResponse>>

  protected success(data?: TResponse): OperationResult<TResponse> {
    return {
      success: true,
      data
    }
  }

  protected failure(message: string, code: string = 'UNKNOWN_ERROR', details?: any): OperationResult<TResponse> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    }
  }

  protected async handleAsync<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<OperationResult<T>> {
    try {
      const result = await operation()
      return this.success(result)
    } catch (error) {
      console.error(errorMessage, error)
      return this.failure(
        error instanceof Error ? error.message : errorMessage,
        'OPERATION_ERROR',
        error
      )
    }
  }
}