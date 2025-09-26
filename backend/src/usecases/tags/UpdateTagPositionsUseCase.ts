import { TagRepository } from '../../interfaces/repositories/TagRepository'

export interface TagPositionData {
  id: string
  position: number
}

export class UpdateTagPositionsUseCase {
  constructor(private tagRepository: TagRepository) {}

  async execute(tagPositions: TagPositionData[], userId: string): Promise<void> {
    // Validation des données
    this.validatePositionData(tagPositions)

    // Vérifier que tous les tags existent et appartiennent à l'utilisateur
    const userTags = await this.tagRepository.findAll(userId)
    const userTagIds = new Set(userTags.map(tag => tag.id))

    for (const { id } of tagPositions) {
      if (!userTagIds.has(id)) {
        throw new Error(`Tag with id ${id} not found or access denied`)
      }
    }

    // Mettre à jour les positions
    await this.tagRepository.updatePositions(userId, tagPositions)
  }

  private validatePositionData(tagPositions: TagPositionData[]): void {
    if (!Array.isArray(tagPositions)) {
      throw new Error('Tag positions must be an array')
    }

    if (tagPositions.length === 0) {
      throw new Error('At least one tag position is required')
    }

    for (const { id, position } of tagPositions) {
      if (!id || typeof id !== 'string') {
        throw new Error('Tag id is required and must be a string')
      }

      if (typeof position !== 'number' || position < 0 || !Number.isInteger(position)) {
        throw new Error('Position must be a non-negative integer')
      }
    }

    // Vérifier qu'il n'y a pas de doublons dans les IDs
    const ids = tagPositions.map(tp => tp.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      throw new Error('Duplicate tag IDs are not allowed')
    }
  }
}