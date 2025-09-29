/**
 * Composable validation patterns for building complex validation rules
 */

import type { OperationResult } from '../../types/OperationResult'
import { OperationResultUtils } from '../../types/OperationResult'

export type ValidationRule<T> = (value: T) => OperationResult<T>

export interface ValidationChain<T> {
  /**
   * Add a validation rule to the chain
   */
  addRule(rule: ValidationRule<T>): ValidationChain<T>

  /**
   * Validate the value through all rules
   */
  validate(value: T): OperationResult<T>
}

/**
 * Validation composer for building complex validation chains
 */
export class ValidationComposer {
  /**
   * Create a validation chain
   */
  static createChain<T>(): ValidationChain<T> {
    const rules: ValidationRule<T>[] = []

    return {
      addRule(rule: ValidationRule<T>): ValidationChain<T> {
        rules.push(rule)
        return this
      },

      validate(value: T): OperationResult<T> {
        for (const rule of rules) {
          const result = rule(value)
          if (!result.success) {
            return result
          }
        }

        return {
          success: true,
          data: value
        }
      }
    }
  }

  /**
   * Combine multiple validation rules into one (all must pass)
   */
  static all<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
    return (value: T) => {
      for (const rule of rules) {
        const result = rule(value)
        if (!result.success) {
          return result
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Combine multiple validation rules (at least one must pass)
   */
  static any<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
    return (value: T) => {
      const errors: string[] = []

      for (const rule of rules) {
        const result = rule(value)
        if (result.success) {
          return result
        }
        if (result.error) {
          errors.push(result.error.message)
        }
      }

      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `All validations failed: ${errors.join(', ')}`
        },
        data: value
      }
    }
  }

  /**
   * Negate a validation rule
   */
  static not<T>(rule: ValidationRule<T>, errorMessage: string): ValidationRule<T> {
    return (value: T) => {
      const result = rule(value)
      if (result.success) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage },
          data: value
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Conditional validation (only validate if condition is true)
   */
  static when<T>(
    condition: (value: T) => boolean,
    rule: ValidationRule<T>
  ): ValidationRule<T> {
    return (value: T) => {
      if (condition(value)) {
        return rule(value)
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Create a custom validation rule
   */
  static custom<T>(
    validator: (value: T) => boolean,
    errorMessage: string
  ): ValidationRule<T> {
    return (value: T) => {
      if (validator(value)) {
        return {
          success: true,
          data: value
        }
      }

      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: errorMessage },
        data: value
      }
    }
  }
}

/**
 * Common validation rule builders
 */
export class CommonValidators {
  /**
   * Validate that a value is required (not null/undefined/empty)
   */
  static required<T>(errorMessage: string = 'Value is required'): ValidationRule<T> {
    return (value: T) => {
      if (value === null || value === undefined) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage },
          data: value
        }
      }

      if (typeof value === 'string' && value.trim() === '') {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage },
          data: value
        }
      }

      if (Array.isArray(value) && value.length === 0) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage },
          data: value
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Validate string length
   */
  static stringLength(
    min?: number,
    max?: number,
    errorMessage?: string
  ): ValidationRule<string> {
    return (value: string) => {
      const length = value?.length || 0

      if (min !== undefined && length < min) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage || `String must be at least ${min} characters` },
          data: value
        }
      }

      if (max !== undefined && length > max) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage || `String must be at most ${max} characters` },
          data: value
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Validate number range
   */
  static numberRange(
    min?: number,
    max?: number,
    errorMessage?: string
  ): ValidationRule<number> {
    return (value: number) => {
      if (min !== undefined && value < min) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage || `Number must be at least ${min}` },
          data: value
        }
      }

      if (max !== undefined && value > max) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage || `Number must be at most ${max}` },
          data: value
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Validate that value matches a pattern
   */
  static pattern(
    pattern: RegExp,
    errorMessage: string = 'Value does not match pattern'
  ): ValidationRule<string> {
    return (value: string) => {
      if (!value || !pattern.test(value)) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage },
          data: value
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }

  /**
   * Validate that value is one of allowed values
   */
  static oneOf<T>(
    allowedValues: T[],
    errorMessage?: string
  ): ValidationRule<T> {
    return (value: T) => {
      if (!allowedValues.includes(value)) {
        return {
          success: false,
          error: { code: "VALIDATION_ERROR", message: errorMessage || `Value must be one of: ${allowedValues.join(', ')}` },
          data: value
        }
      }

      return {
        success: true,
        data: value
      }
    }
  }
}