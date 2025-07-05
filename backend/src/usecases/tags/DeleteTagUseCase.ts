import { TagRepository } from '../../interfaces/repositories/TagRepository'

export class DeleteTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    // Vérifier que le tag existe et appartient à l'utilisateur
    const tag = await this.tagRepository.findById(id)
    if (!tag || tag.userId !== userId) {
      throw new Error('Tag not found or access denied')
    }

    await this.tagRepository.delete(id)
  }
} 