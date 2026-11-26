import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { CreateTagData, Tag } from '../../domain/entities/Tag'
import { BaseUseCase, SharedUseCaseValidator, TagValidationService, TAG_CONSTANTS, AsyncOperationResult, OperationResult } from '@gtd/shared'

/**
 * Generate a random color from the allowed palette.
 * Returns a hex color string from TAG_CONSTANTS.allowedColors.
 */
function randomTagColor(): string {
  const colors = TAG_CONSTANTS.allowedColors
  return colors[Math.floor(Math.random() * colors.length)]
}

export interface CreateTagRequest extends CreateTagData {}
export interface CreateTagResponse extends Tag {}

export class CreateTagUseCase extends BaseUseCase<CreateTagRequest, CreateTagResponse> {
  constructor(private tagRepository: TagRepository) {
    super()
  }

  async execute(request: CreateTagRequest): AsyncOperationResult<CreateTagResponse> {
    // Use shared validation
    const validation = SharedUseCaseValidator.validateCreateTagData(request)
    if (!validation.success) {
      return validation as OperationResult<CreateTagResponse>
    }

    // Assign a random color if none was provided
    const tagData = { ...request }
    if (!tagData.color) {
      tagData.color = randomTagColor()
    }

    // Check for duplicates and create tag
    return await this.handleAsync(async () => {
      const existingTags = await this.tagRepository.findAll(request.userId)
      const uniqueValidation = TagValidationService.validateUniqueNameAmongTags(
        tagData.name,
        existingTags
      )
      if (!uniqueValidation.success) {
        throw new Error(uniqueValidation.validationErrors?.join(', ') || 'Tag name already exists')
      }

      return await this.tagRepository.create(tagData)
    }, 'tag creation')
  }
}
