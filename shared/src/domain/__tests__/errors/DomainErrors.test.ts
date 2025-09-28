import { describe, it, expect } from 'vitest'
import {
  BaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  BusinessRuleError,
  TaskValidationError,
  TagValidationError,
  CsvError
} from '../../errors'

describe('Domain Errors', () => {
  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'name' })

      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.context).toEqual({ field: 'name' })
    })

    it('should serialize to JSON correctly', () => {
      const error = new ValidationError('Test error')
      const json = error.toJSON()

      expect(json).toMatchObject({
        name: 'ValidationError',
        code: 'VALIDATION_ERROR',
        message: 'Test error',
        statusCode: 400
      })
    })
  })

  describe('NotFoundError', () => {
    it('should create error with resource only', () => {
      const error = new NotFoundError('Task')

      expect(error.message).toBe('Task not found')
      expect(error.statusCode).toBe(404)
      expect(error.context).toEqual({ resource: 'Task', id: undefined })
    })

    it('should create error with resource and id', () => {
      const error = new NotFoundError('Task', '123')

      expect(error.message).toBe("Task with id '123' not found")
      expect(error.context).toEqual({ resource: 'Task', id: '123' })
    })
  })

  describe('UnauthorizedError', () => {
    it('should use default message', () => {
      const error = new UnauthorizedError()

      expect(error.message).toBe('User not authenticated')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('should use custom message', () => {
      const error = new UnauthorizedError('Token expired')

      expect(error.message).toBe('Token expired')
    })
  })

  describe('ForbiddenError', () => {
    it('should use default message', () => {
      const error = new ForbiddenError()

      expect(error.message).toBe('Access denied')
      expect(error.statusCode).toBe(403)
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error with context', () => {
      const error = new ConflictError('Resource already exists', { id: '123' })

      expect(error.statusCode).toBe(409)
      expect(error.context).toEqual({ id: '123' })
    })
  })

  describe('InternalServerError', () => {
    it('should create internal error', () => {
      const error = new InternalServerError()

      expect(error.message).toBe('Internal server error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(false)
    })
  })

  describe('BusinessRuleError', () => {
    it('should create business rule error', () => {
      const error = new BusinessRuleError('Cannot complete parent task with incomplete subtasks')

      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION')
      expect(error.isOperational).toBe(true)
    })
  })

  describe('TaskValidationError', () => {
    it('should create task validation error', () => {
      const error = new TaskValidationError('importance', 10, 'must be between 1 and 5')

      expect(error.code).toBe('TASK_VALIDATION_ERROR')
      expect(error.message).toBe('Invalid task importance: must be between 1 and 5')
      expect(error.context).toEqual({
        field: 'importance',
        value: 10,
        constraint: 'must be between 1 and 5'
      })
    })
  })

  describe('TagValidationError', () => {
    it('should create tag validation error', () => {
      const error = new TagValidationError('name', '', 'cannot be empty')

      expect(error.code).toBe('TAG_VALIDATION_ERROR')
      expect(error.message).toBe('Invalid tag name: cannot be empty')
    })
  })

  describe('CsvError', () => {
    it('should create CSV error without line number', () => {
      const error = new CsvError('Invalid CSV format')

      expect(error.code).toBe('CSV_ERROR')
      expect(error.message).toBe('Invalid CSV format')
    })

    it('should create CSV error with line number', () => {
      const error = new CsvError('Invalid data format', 5)

      expect(error.message).toBe('Line 5: Invalid data format')
      expect(error.context).toEqual({ line: 5 })
    })

    it('should create CSV error with line and additional context', () => {
      const error = new CsvError('Missing required field', 3, { field: 'name' })

      expect(error.message).toBe('Line 3: Missing required field')
      expect(error.context).toEqual({ line: 3, field: 'name' })
    })
  })

  describe('Error inheritance', () => {
    it('should maintain instanceof relationships', () => {
      const validationError = new ValidationError('test')
      const taskError = new TaskValidationError('name', '', 'required')
      const csvError = new CsvError('test')

      expect(validationError).toBeInstanceOf(BaseError)
      expect(validationError).toBeInstanceOf(ValidationError)
      expect(validationError).toBeInstanceOf(Error)

      expect(taskError).toBeInstanceOf(BaseError)
      expect(taskError).toBeInstanceOf(TaskValidationError)
      expect(taskError).toBeInstanceOf(Error)

      expect(csvError).toBeInstanceOf(BaseError)
      expect(csvError).toBeInstanceOf(CsvError)
      expect(csvError).toBeInstanceOf(Error)
    })
  })
})