import { BaseUseCase } from '../base/UseCase'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { TagEntity, CreateTagData } from '../../domain/entities/Tag'
import { TAG_CONSTANTS } from '../../domain/types/BusinessConstants'
import { OperationResult } from '../../domain/types/Common'

export interface CreateTagRequest extends CreateTagData {
  // Additional business logic parameters
}

export interface CreateTagResponse {
  tag: TagEntity
}

export class CreateTagUseCase extends BaseUseCase<CreateTagRequest, CreateTagResponse> {
  constructor(private tagRepository: TagRepository) {
    super()
  }

  async execute(request: CreateTagRequest): Promise<OperationResult<CreateTagResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      const validation = this.validateCreateTagRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Check for duplicate names
      const existingTag = await this.tagRepository.getByName(request.name.trim())
      if (existingTag) {
        throw new Error('A tag with this name already exists')
      }

      // Apply business rules
      const tagData = this.applyBusinessRules(request)

      // Create the tag
      const createdTag = await this.tagRepository.create(tagData)
      const tagEntity = new TagEntity(createdTag)

      return {
        tag: tagEntity
      }
    }, 'Failed to create tag')
  }

  private validateCreateTagRequest(request: CreateTagRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate required fields
    if (!request.name || request.name.trim().length === 0) {
      errors.push('Tag name is required')
    }

    // Validate name length
    if (request.name) {
      const trimmedName = request.name.trim()
      if (trimmedName.length < TAG_CONSTANTS.nameMinLength) {
        errors.push(`Tag name must be at least ${TAG_CONSTANTS.nameMinLength} character`)
      }
      if (trimmedName.length > TAG_CONSTANTS.nameMaxLength) {
        errors.push(`Tag name cannot exceed ${TAG_CONSTANTS.nameMaxLength} characters`)
      }
    }

    // Validate reserved names
    if (request.name && TAG_CONSTANTS.reservedNames.includes(request.name.toLowerCase())) {
      errors.push('This tag name is reserved and cannot be used')
    }

    // Validate color format
    if (request.color) {
      const tagEntity = new TagEntity({
        id: '',
        name: request.name,
        color: request.color,
        userId: '',
        createdAt: '',
        updatedAt: ''
      })
      if (!tagEntity.isValidColor()) {
        errors.push('Invalid color format. Use hex color format (e.g., #FF0000)')
      }

      // Check if color is in allowed list
      if (!TAG_CONSTANTS.allowedColors.includes(request.color)) {
        errors.push('Color is not in the allowed color palette')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private applyBusinessRules(request: CreateTagRequest): CreateTagData {
    const tagData: CreateTagData = {
      name: request.name.trim(),
      color: request.color
    }

    // Ensure color is in uppercase hex format
    if (tagData.color) {
      tagData.color = tagData.color.toUpperCase()
    }

    return tagData
  }
}