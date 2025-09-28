import type { TagValidationConstraints, TagOperationResult, TagBase } from '../entities/TagTypes'
import { TAG_CONSTANTS } from '../constants/BusinessRules'
import { VALIDATION_PATTERNS } from '../constants/ValidationRules'
import { TagValidationError } from '../errors/DomainErrors'

/**
 * Shared Tag Validation Service
 * Provides centralized validation logic for tag operations
 */
export class TagValidationService {
  private static readonly constraints: TagValidationConstraints = {
    name: {
      minLength: TAG_CONSTANTS.nameMinLength,
      maxLength: TAG_CONSTANTS.nameMaxLength,
      pattern: VALIDATION_PATTERNS.TAG_NAME,
      reservedNames: TAG_CONSTANTS.reservedNames
    },
    color: {
      pattern: VALIDATION_PATTERNS.HEX_COLOR,
      allowedValues: [] // Don't enforce color palette by default - colors are for UI guidance only
    },
    business: {
      maxTagsPerTask: TAG_CONSTANTS.maxTagsPerTask,
      caseSensitive: TAG_CONSTANTS.caseSensitive,
      allowDuplicateNames: TAG_CONSTANTS.allowDuplicateNames
    }
  }

  /**
   * Validate tag name
   */
  static validateName(name: string): TagOperationResult<boolean> {
    const errors: string[] = []

    // Check if name exists
    if (!name || typeof name !== 'string') {
      errors.push('Tag name is required')
      return { success: false, validationErrors: errors }
    }

    const trimmedName = name.trim()

    // Check minimum length
    if (trimmedName.length < this.constraints.name.minLength) {
      errors.push(`Tag name must be at least ${this.constraints.name.minLength} character(s)`)
    }

    // Check maximum length
    if (trimmedName.length > this.constraints.name.maxLength) {
      errors.push(`Tag name must not exceed ${this.constraints.name.maxLength} characters`)
    }

    // Check pattern if defined
    if (this.constraints.name.pattern && !this.constraints.name.pattern.test(trimmedName)) {
      errors.push('Tag name contains invalid characters')
    }

    // Check reserved names
    const nameToCheck = this.constraints.business.caseSensitive ? trimmedName : trimmedName.toLowerCase()
    const reservedNames = this.constraints.business.caseSensitive
      ? this.constraints.name.reservedNames
      : this.constraints.name.reservedNames.map(name => name.toLowerCase())

    if (reservedNames.includes(nameToCheck)) {
      errors.push('Tag name is reserved and cannot be used')
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate tag color
   */
  static validateColor(color?: string): TagOperationResult<boolean> {
    const errors: string[] = []

    // Color is optional
    if (!color) {
      return { success: true, data: true }
    }

    if (typeof color !== 'string') {
      errors.push('Tag color must be a string')
      return { success: false, validationErrors: errors }
    }

    const trimmedColor = color.trim()

    // Check hex color pattern
    if (!this.constraints.color.pattern.test(trimmedColor)) {
      errors.push('Tag color must be a valid hex color (e.g., #FF0000 or #F00)')
    }

    // Check allowed values if defined
    if (this.constraints.color.allowedValues && this.constraints.color.allowedValues.length > 0) {
      const normalizedColor = trimmedColor.toUpperCase()
      const allowedColorsUpper = this.constraints.color.allowedValues.map(c => c.toUpperCase())
      if (!allowedColorsUpper.includes(normalizedColor)) {
        errors.push('Tag color is not in the allowed color palette')
      }
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate tag data for creation
   */
  static validateCreateData(data: {
    name: string
    color?: string
    userId: string
  }): TagOperationResult<boolean> {
    const errors: string[] = []

    // Validate user ID
    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      errors.push('User ID is required')
    }

    // Validate name
    const nameValidation = this.validateName(data.name)
    if (!nameValidation.success && nameValidation.validationErrors) {
      errors.push(...nameValidation.validationErrors)
    }

    // Validate color
    const colorValidation = this.validateColor(data.color)
    if (!colorValidation.success && colorValidation.validationErrors) {
      errors.push(...colorValidation.validationErrors)
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate tag data for update
   */
  static validateUpdateData(data: {
    name?: string
    color?: string
    userId?: string
  }): TagOperationResult<boolean> {
    const errors: string[] = []

    // At least one field should be provided for update
    if (!data.name && !data.color && !data.userId) {
      errors.push('At least one field must be provided for update')
      return { success: false, validationErrors: errors }
    }

    // Validate name if provided
    if (data.name !== undefined) {
      const nameValidation = this.validateName(data.name)
      if (!nameValidation.success && nameValidation.validationErrors) {
        errors.push(...nameValidation.validationErrors)
      }
    }

    // Validate color if provided
    if (data.color !== undefined) {
      const colorValidation = this.validateColor(data.color)
      if (!colorValidation.success && colorValidation.validationErrors) {
        errors.push(...colorValidation.validationErrors)
      }
    }

    // Validate user ID if provided
    if (data.userId !== undefined && (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0)) {
      errors.push('User ID must be a valid string')
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Check if tag name is unique among existing tags
   */
  static validateUniqueNameAmongTags(
    name: string,
    existingTags: TagBase[],
    excludeTagId?: string
  ): TagOperationResult<boolean> {
    const errors: string[] = []

    if (!this.constraints.business.allowDuplicateNames) {
      const nameToCheck = this.constraints.business.caseSensitive ? name.trim() : name.trim().toLowerCase()

      const duplicateTag = existingTags.find(tag => {
        if (excludeTagId && tag.id === excludeTagId) {
          return false // Exclude the tag being updated
        }

        const existingName = this.constraints.business.caseSensitive
          ? tag.name.trim()
          : tag.name.trim().toLowerCase()

        return existingName === nameToCheck
      })

      if (duplicateTag) {
        errors.push('A tag with this name already exists')
      }
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate that the number of tags doesn't exceed the maximum allowed per task
   */
  static validateTagCountForTask(currentTagCount: number): TagOperationResult<boolean> {
    const errors: string[] = []

    if (currentTagCount >= this.constraints.business.maxTagsPerTask) {
      errors.push(`Cannot add more than ${this.constraints.business.maxTagsPerTask} tags per task`)
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Validate complete tag entity
   */
  static validateTag(tag: TagBase): TagOperationResult<boolean> {
    const errors: string[] = []

    // Validate basic fields
    const nameValidation = this.validateName(tag.name)
    if (!nameValidation.success && nameValidation.validationErrors) {
      errors.push(...nameValidation.validationErrors)
    }

    const colorValidation = this.validateColor(tag.color)
    if (!colorValidation.success && colorValidation.validationErrors) {
      errors.push(...colorValidation.validationErrors)
    }

    // Validate required fields
    if (!tag.id || typeof tag.id !== 'string') {
      errors.push('Tag ID is required')
    }

    if (!tag.userId || typeof tag.userId !== 'string') {
      errors.push('User ID is required')
    }

    if (!tag.createdAt) {
      errors.push('Created date is required')
    }

    if (!tag.updatedAt) {
      errors.push('Updated date is required')
    }

    if (errors.length > 0) {
      throw new TagValidationError('validation', tag, errors.join(', '))
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Get validation constraints (read-only)
   */
  static getConstraints(): Readonly<TagValidationConstraints> {
    return this.constraints
  }

  /**
   * Sanitize tag name by trimming and applying business rules
   */
  static sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') {
      return ''
    }

    let sanitized = name.trim()

    // Apply case sensitivity rules
    if (!this.constraints.business.caseSensitive) {
      sanitized = sanitized.toLowerCase()
    }

    return sanitized
  }

  /**
   * Sanitize tag color by trimming and normalizing format
   */
  static sanitizeColor(color?: string): string | undefined {
    if (!color || typeof color !== 'string') {
      return undefined
    }

    let sanitized = color.trim().toUpperCase()

    // Ensure hex color starts with #
    if (sanitized && !sanitized.startsWith('#')) {
      sanitized = '#' + sanitized
    }

    // Convert 3-digit hex to 6-digit hex
    if (sanitized.length === 4 && this.constraints.color.pattern.test(sanitized)) {
      const r = sanitized[1]
      const g = sanitized[2]
      const b = sanitized[3]
      sanitized = `#${r}${r}${g}${g}${b}${b}`
    }

    return sanitized
  }
}