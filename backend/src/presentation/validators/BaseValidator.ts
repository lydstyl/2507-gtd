import { ValidationError } from '@gtd/shared'

export interface ValidationRule<T = any> {
  validate: (value: T, context?: Record<string, any>) => boolean
  message: string
}

export class Validator {
  static required(message: string = 'Field is required'): ValidationRule {
    return {
      validate: (value: any) => value !== undefined && value !== null && value !== '',
      message
    }
  }

  static string(message: string = 'Must be a string'): ValidationRule {
    return {
      validate: (value: any) => typeof value === 'string',
      message
    }
  }

  static number(message: string = 'Must be a number'): ValidationRule {
    return {
      validate: (value: any) => typeof value === 'number' && !isNaN(value),
      message
    }
  }

  static boolean(message: string = 'Must be a boolean'): ValidationRule {
    return {
      validate: (value: any) => typeof value === 'boolean',
      message
    }
  }

  static email(message: string = 'Must be a valid email'): ValidationRule {
    return {
      validate: (value: any) => {
        if (typeof value !== 'string') return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value)
      },
      message
    }
  }

  static minLength(min: number, message?: string): ValidationRule {
    return {
      validate: (value: any) => {
        if (typeof value !== 'string') return false
        return value.length >= min
      },
      message: message || `Must be at least ${min} characters long`
    }
  }

  static maxLength(max: number, message?: string): ValidationRule {
    return {
      validate: (value: any) => {
        if (typeof value !== 'string') return false
        return value.length <= max
      },
      message: message || `Must be at most ${max} characters long`
    }
  }

  static range(min: number, max: number, message?: string): ValidationRule {
    return {
      validate: (value: any) => {
        if (typeof value !== 'number') return false
        return value >= min && value <= max
      },
      message: message || `Must be between ${min} and ${max}`
    }
  }

  static optional<T>(rule: ValidationRule<T>): ValidationRule<T | undefined> {
    return {
      validate: (value: T | undefined) => {
        if (value === undefined || value === null) return true
        return rule.validate(value)
      },
      message: rule.message
    }
  }

  static array(itemRule?: ValidationRule, message: string = 'Must be an array'): ValidationRule {
    return {
      validate: (value: any) => {
        if (!Array.isArray(value)) return false
        if (!itemRule) return true
        return value.every(item => itemRule.validate(item))
      },
      message
    }
  }
}

export class ValidationSchema {
  private rules: Record<string, ValidationRule[]> = {}

  field(name: string, ...rules: ValidationRule[]): this {
    this.rules[name] = rules
    return this
  }

  validate(data: Record<string, any>): void {
    const errors: Record<string, string[]> = {}

    for (const [fieldName, fieldRules] of Object.entries(this.rules)) {
      const value = data[fieldName]
      const fieldErrors: string[] = []

      for (const rule of fieldRules) {
        if (!rule.validate(value, data)) {
          fieldErrors.push(rule.message)
        }
      }

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', { errors })
    }
  }
}