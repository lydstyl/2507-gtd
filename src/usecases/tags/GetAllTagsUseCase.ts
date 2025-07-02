import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { Tag } from '../../domain/entities/Tag'

export class GetAllTagsUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(userId: string): Promise<Tag[]> {
    return await this.tagRepository.findAll(userId)
  }
}
