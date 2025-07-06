import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { Tag } from '../../domain/entities/Tag'

export interface UpdateTagData {
  name: string
  color: string
}

export class UpdateTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(id: string, data: UpdateTagData, userId: string): Promise<Tag> {
    // Validation des données
    this.validateUpdateData(data)

    // Vérifier que le tag existe et appartient à l'utilisateur
    const existingTag = await this.tagRepository.findById(id)
    if (!existingTag) {
      throw new Error('Tag not found')
    }

    if (existingTag.userId !== userId) {
      throw new Error('Access denied')
    }

    // Vérifier que le nom n'est pas déjà utilisé par un autre tag de l'utilisateur
    const allTags = await this.tagRepository.findAll(userId)
    const nameExists = allTags.some(tag => tag.name === data.name && tag.id !== id)
    if (nameExists) {
      throw new Error('A tag with this name already exists')
    }

    // Mettre à jour le tag
    const updatedTag = await this.tagRepository.update(id, data)
    return updatedTag
  }

  private validateUpdateData(data: UpdateTagData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tag name is required')
    }

    if (data.name.trim().length > 50) {
      throw new Error('Tag name must be less than 50 characters')
    }

    if (!data.color || !/^#[0-9A-F]{6}$/i.test(data.color)) {
      throw new Error('Valid color is required (hex format)')
    }
  }
} 