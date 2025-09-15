import { Request, Response, NextFunction } from 'express'
import { ValidationSchema } from '../validators'

export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.validate(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.validate(req.query)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.validate(req.params)
      next()
    } catch (error) {
      next(error)
    }
  }
}