import { BaseError } from './BaseError'

export class ValidationError extends BaseError {
  readonly statusCode = 400
  readonly isOperational = true

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = 404
  readonly isOperational = true

  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(message, { resource, id })
  }
}

export class UnauthorizedError extends BaseError {
  readonly statusCode = 401
  readonly isOperational = true

  constructor(message: string = 'User not authenticated') {
    super(message)
  }
}

export class ForbiddenError extends BaseError {
  readonly statusCode = 403
  readonly isOperational = true

  constructor(message: string = 'Access denied') {
    super(message)
  }
}

export class ConflictError extends BaseError {
  readonly statusCode = 409
  readonly isOperational = true

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

export class InternalServerError extends BaseError {
  readonly statusCode = 500
  readonly isOperational = false

  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, context)
  }
}