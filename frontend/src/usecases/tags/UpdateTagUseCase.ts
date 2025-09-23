import { BaseUseCase } from '../base/UseCase'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { TagEntity, UpdateTagData } from '../../domain/entities/Tag'
import { TAG_CONSTANTS } from '../../domain/types/BusinessConstants'
import { OperationResult } from '../../domain/types/Common'

export interface UpdateTagRequest {
  id: string
  data: UpdateTagData
}

export interface UpdateTagResponse {
  tag: TagEntity
}

export class UpdateTagUseCase extends BaseUseCase<UpdateTagRequest, UpdateTagResponse> {
  constructor(private tagRepository: TagRepository) {
    super()
  }

  async execute(request: UpdateTagRequest): Promise<OperationResult<UpdateTagResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      const validation = this.validateUpdateTagRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Check if tag exists
      const currentTag = await this.tagRepository.getById(request.id)
      if (!currentTag) {
        throw new Error('Tag not found')
      }

      // Check for duplicate names (if name is being changed)
      if (request.data.name && request.data.name.trim() !== currentTag.name) {
        const existingTag = await this.tagRepository.getByName(request.data.name.trim())
        if (existingTag) {
          throw new Error('A tag with this name already exists')
        }
      }

      // Apply business rules
      const updateData = this.applyBusinessRules(request.data)

      // Update the tag
      const updatedTag = await this.tagRepository.update(request.id, updateData)
      const tagEntity = new TagEntity(updatedTag)

      return {
        tag: tagEntity
      }
    }, 'Failed to update tag')
  }

  private validateUpdateTagRequest(request: UpdateTagRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate ID
    if (!request.id || request.id.trim().length === 0) {
      errors.push('Tag ID is required')
    }

    // Validate name if provided
    if (request.data.name !== undefined) {
      if (!request.data.name || request.data.name.trim().length === 0) {
        errors.push('Tag name cannot be empty')
      } else {
        const trimmedName = request.data.name.trim()
        if (trimmedName.length < TAG_CONSTANTS.nameMinLength) {
          errors.push(`Tag name must be at least ${TAG_CONSTANTS.nameMinLength} character`)
        }
        if (trimmedName.length > TAG_CONSTANTS.nameMaxLength) {
          errors.push(`Tag name cannot exceed ${TAG_CONSTANTS.nameMaxLength} characters`)
        }

        // Check reserved names
        if (TAG_CONSTANTS.reservedNames.includes(trimmedName.toLowerCase())) {
          errors.push('This tag name is reserved and cannot be used')
        }
      }
    }

    // Validate color if provided
    if (request.data.color !== undefined && request.data.color !== null) {
      const tagEntity = new TagEntity({
        id: '',
        name: 'test',
        color: request.data.color,
        userId: '',
        createdAt: '',
        updatedAt: ''
      })
      if (!tagEntity.isValidColor()) {
        errors.push('Invalid color format. Use hex color format (e.g., #FF0000)')
      }

      // Check if color is in allowed list
      if (!TAG_CONSTANTS.allowedColors.includes(request.data.color)) {
        errors.push('Color is not in the allowed color palette')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private applyBusinessRules(updateData: UpdateTagData): UpdateTagData {
    const processedData: UpdateTagData = { ...updateData }

    // Trim name
    if (processedData.name !== undefined) {
      processedData.name = processedData.name.trim()
    }

    // Ensure color is in uppercase hex format
    if (processedData.color !== undefined && processedData.color !== null) {
      processedData.color = processedData.color.toUpperCase()
    }

    return processedData
  }
}