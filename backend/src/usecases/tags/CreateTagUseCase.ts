import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { CreateTagData, Tag } from '../../domain/entities/Tag'
import { BaseUseCase, SharedUseCaseValidator, TagValidationService, AsyncOperationResult, OperationResult } from '@gtd/shared'

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

    // Check for duplicates and create tag
    return await this.handleAsync(async () => {
      const existingTags = await this.tagRepository.findAll(request.userId)
      const uniqueValidation = TagValidationService.validateUniqueNameAmongTags(
        request.name,
        existingTags
      )
      if (!uniqueValidation.success) {
        throw new Error(uniqueValidation.validationErrors?.join(', ') || 'Tag name already exists')
      }

      return await this.tagRepository.create(request)
    }, 'tag creation')
  }
}
