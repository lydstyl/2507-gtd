import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { CreateTagData, Tag } from '../../domain/entities/Tag'

export class CreateTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(data: CreateTagData): Promise<Tag> {
    this.validateTagData(data)
    if (!data.userId) throw new Error('userId is required for tag creation')
    return await this.tagRepository.create(data)
  }

  private validateTagData(data: CreateTagData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tag name is required')
    }
  }
}
