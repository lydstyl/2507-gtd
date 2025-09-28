import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { Tag, UpdateTagData } from '../../domain/entities/Tag'
import { TagValidationService } from '@gtd/shared'

export class UpdateTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(id: string, data: UpdateTagData, userId: string): Promise<Tag> {
    // Use shared validation service
    const validation = TagValidationService.validateUpdateData(data)
    if (!validation.success) {
      throw new Error(validation.validationErrors?.join(', ') || 'Tag validation failed')
    }

    // Vérifier que le tag existe et appartient à l'utilisateur
    const existingTag = await this.tagRepository.findById(id)
    if (!existingTag) {
      throw new Error('Tag not found')
    }

    if (existingTag.userId !== userId) {
      throw new Error('Access denied')
    }

    // Check for duplicate names if name is being changed
    if (data.name) {
      const allTags = await this.tagRepository.findAll(userId)
      const uniqueValidation = TagValidationService.validateUniqueNameAmongTags(
        data.name,
        allTags,
        id // Exclude current tag from duplicate check
      )
      if (!uniqueValidation.success) {
        throw new Error(uniqueValidation.validationErrors?.join(', ') || 'Tag name already exists')
      }
    }

    // Mettre à jour le tag
    const updatedTag = await this.tagRepository.update(id, data)
    return updatedTag
  }
} 