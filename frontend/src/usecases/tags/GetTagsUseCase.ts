import { BaseUseCase } from '../base/UseCase'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { TagEntity } from '../../domain/entities/Tag'
import { TagFilters } from '../../domain/types/TagTypes'
import { OperationResult } from '../../domain/types/Common'

export interface GetTagsRequest {
  filters?: TagFilters
  sortBy?: 'name' | 'createdAt' | 'taskCount'
  sortDirection?: 'asc' | 'desc'
}

export interface GetTagsResponse {
  tags: TagEntity[]
  totalCount: number
}

export class GetTagsUseCase extends BaseUseCase<GetTagsRequest, GetTagsResponse> {
  constructor(private tagRepository: TagRepository) {
    super()
  }

  async execute(request: GetTagsRequest = {}): Promise<OperationResult<GetTagsResponse>> {
    return this.handleAsync(async () => {
      let tags: any[]

      // Fetch tags based on filters
      if (request.filters) {
        tags = await this.tagRepository.getByFilters(request.filters)
      } else {
        tags = await this.tagRepository.getAll()
      }

      // Convert to TagEntity instances
      let tagEntities = tags.map(tag => new TagEntity(tag))

      // Apply sorting
      if (request.sortBy) {
        tagEntities = this.sortTags(tagEntities, request.sortBy, request.sortDirection || 'asc')
      }

      return {
        tags: tagEntities,
        totalCount: tagEntities.length
      }
    }, 'Failed to fetch tags')
  }

  private sortTags(tags: TagEntity[], sortBy: string, direction: 'asc' | 'desc'): TagEntity[] {
    return [...tags].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'taskCount':
          // This would need to be implemented with task count data
          comparison = 0
          break
        default:
          comparison = 0
      }

      return direction === 'desc' ? -comparison : comparison
    })
  }
}