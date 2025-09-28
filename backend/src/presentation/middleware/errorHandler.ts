import { Request, Response, NextFunction } from 'express'
import { BaseError } from '@gtd/shared'

export interface ErrorResponse {
  error: {
    message: string
    status: number
    timestamp: string
    path: string
    context?: Record<string, any>
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500
  let message = 'Internal server error'
  let context: Record<string, any> | undefined

  // Handle our custom errors
  if (err instanceof BaseError) {
    statusCode = err.statusCode
    message = err.message
    context = err.context
  }

  // Log error for debugging (will be replaced with structured logging later)
  console.error(`Error ${statusCode}: ${message}`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    context
  })

  const errorResponse: ErrorResponse = {
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(context && { context })
    }
  }

  res.status(statusCode).json(errorResponse)
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}