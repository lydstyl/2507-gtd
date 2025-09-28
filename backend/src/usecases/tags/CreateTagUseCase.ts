import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { CreateTagData, Tag } from '../../domain/entities/Tag'
import { TagValidationService } from '@gtd/shared'

export class CreateTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(data: CreateTagData): Promise<Tag> {
    // Use shared validation service
    const validation = TagValidationService.validateCreateData(data)
    if (!validation.success) {
      throw new Error(validation.validationErrors?.join(', ') || 'Tag validation failed')
    }

    // Check for duplicate names among existing tags
    const existingTags = await this.tagRepository.findAll(data.userId)
    const uniqueValidation = TagValidationService.validateUniqueNameAmongTags(
      data.name,
      existingTags
    )
    if (!uniqueValidation.success) {
      throw new Error(uniqueValidation.validationErrors?.join(', ') || 'Tag name already exists')
    }

    return await this.tagRepository.create(data)
  }
}
