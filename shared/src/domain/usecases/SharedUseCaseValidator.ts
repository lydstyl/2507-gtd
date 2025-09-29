import { ValidationResult, OperationResult, OperationResultUtils } from '../types/OperationResult'
import { TASK_CONSTANTS, TAG_CONSTANTS } from '../constants/BusinessRules'

export interface CreateTaskValidationData {
  name: string
  importance?: number
  complexity?: number
  tagIds?: string[]
  parentId?: string | null
}

export interface UpdateTaskValidationData {
  name?: string
  importance?: number
  complexity?: number
  tagIds?: string[]
  parentId?: string | null
}

export interface CreateTagValidationData {
  name: string
  color?: string
  userId: string
}

export class SharedUseCaseValidator {
  static validateTaskName(name: string | undefined): ValidationResult {
    const errors: string[] = []

    if (!name || typeof name !== 'string') {
      errors.push('Task name is required')
    } else if (name.trim().length === 0) {
      errors.push('Task name cannot be empty')
    } else if (name.trim().length > TASK_CONSTANTS.taskNameMaxLength) {
      errors.push(`Task name cannot exceed ${TASK_CONSTANTS.taskNameMaxLength} characters`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateTaskImportance(importance: number | undefined): ValidationResult {
    const errors: string[] = []

    if (importance !== undefined) {
      if (typeof importance !== 'number' || isNaN(importance)) {
        errors.push('Importance must be a valid number')
      } else if (importance < 0 || importance > TASK_CONSTANTS.maxImportance) {
        errors.push(`Importance must be between 0 and ${TASK_CONSTANTS.maxImportance}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateTaskComplexity(complexity: number | undefined): ValidationResult {
    const errors: string[] = []

    if (complexity !== undefined) {
      if (typeof complexity !== 'number' || isNaN(complexity)) {
        errors.push('Complexity must be a valid number')
      } else if (complexity < 1 || complexity > TASK_CONSTANTS.maxComplexity) {
        errors.push(`Complexity must be between 1 and ${TASK_CONSTANTS.maxComplexity}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateTagIds(tagIds: string[] | undefined): ValidationResult {
    const errors: string[] = []

    if (tagIds !== undefined) {
      if (!Array.isArray(tagIds)) {
        errors.push('Tag IDs must be an array')
      } else if (tagIds.length > TAG_CONSTANTS.maxTagsPerTask) {
        errors.push(`Cannot assign more than ${TAG_CONSTANTS.maxTagsPerTask} tags to a task`)
      } else {
        for (const tagId of tagIds) {
          if (typeof tagId !== 'string' || tagId.trim().length === 0) {
            errors.push('All tag IDs must be non-empty strings')
            break
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateCreateTaskData(data: CreateTaskValidationData): OperationResult<void> {
    const allErrors: string[] = []

    // Validate name (required for creation)
    const nameValidation = this.validateTaskName(data.name)
    allErrors.push(...nameValidation.errors)

    // Validate importance (optional)
    const importanceValidation = this.validateTaskImportance(data.importance)
    allErrors.push(...importanceValidation.errors)

    // Validate complexity (optional)
    const complexityValidation = this.validateTaskComplexity(data.complexity)
    allErrors.push(...complexityValidation.errors)

    // Validate tag IDs (optional)
    const tagValidation = this.validateTagIds(data.tagIds)
    allErrors.push(...tagValidation.errors)

    // Validate parent ID format if provided
    if (data.parentId !== undefined && data.parentId !== null) {
      if (typeof data.parentId !== 'string' || data.parentId.trim().length === 0) {
        allErrors.push('Parent ID must be a non-empty string or null')
      }
    }

    if (allErrors.length > 0) {
      return OperationResultUtils.validationFailure(allErrors)
    }

    return OperationResultUtils.success()
  }

  static validateUpdateTaskData(data: UpdateTaskValidationData): OperationResult<void> {
    const allErrors: string[] = []

    // Validate name (optional for updates)
    if (data.name !== undefined) {
      const nameValidation = this.validateTaskName(data.name)
      allErrors.push(...nameValidation.errors)
    }

    // Validate importance (optional)
    const importanceValidation = this.validateTaskImportance(data.importance)
    allErrors.push(...importanceValidation.errors)

    // Validate complexity (optional)
    const complexityValidation = this.validateTaskComplexity(data.complexity)
    allErrors.push(...complexityValidation.errors)

    // Validate tag IDs (optional)
    const tagValidation = this.validateTagIds(data.tagIds)
    allErrors.push(...tagValidation.errors)

    // Validate parent ID format if provided
    if (data.parentId !== undefined && data.parentId !== null) {
      if (typeof data.parentId !== 'string' || data.parentId.trim().length === 0) {
        allErrors.push('Parent ID must be a non-empty string or null')
      }
    }

    if (allErrors.length > 0) {
      return OperationResultUtils.validationFailure(allErrors)
    }

    return OperationResultUtils.success()
  }

  static validateCreateTagData(data: CreateTagValidationData): OperationResult<void> {
    const allErrors: string[] = []

    // Validate tag name (required)
    if (!data.name || typeof data.name !== 'string') {
      allErrors.push('Tag name is required')
    } else if (data.name.trim().length === 0) {
      allErrors.push('Tag name cannot be empty')
    } else if (data.name.trim().length > TAG_CONSTANTS.nameMaxLength) {
      allErrors.push(`Tag name cannot exceed ${TAG_CONSTANTS.nameMaxLength} characters`)
    }

    // Validate user ID (required)
    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      allErrors.push('User ID is required')
    }

    // Validate color format if provided
    if (data.color !== undefined) {
      if (typeof data.color !== 'string') {
        allErrors.push('Tag color must be a string')
      } else if (data.color && !data.color.match(/^#[0-9A-Fa-f]{6}$/)) {
        allErrors.push('Tag color must be a valid hex color (e.g., #FF0000)')
      }
    }

    if (allErrors.length > 0) {
      return OperationResultUtils.validationFailure(allErrors)
    }

    return OperationResultUtils.success()
  }

  static combineValidationResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = []

    for (const result of results) {
      if (!result.isValid) {
        allErrors.push(...result.errors)
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }
}