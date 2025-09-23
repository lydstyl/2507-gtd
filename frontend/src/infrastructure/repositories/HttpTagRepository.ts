import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'
import { TagFilters } from '../../domain/types/TagTypes'
import { tagsApi } from '../../services/api'

export class HttpTagRepository implements TagRepository {
  async getAll(): Promise<Tag[]> {
    return await tagsApi.getTags()
  }

  async getById(id: string): Promise<Tag | null> {
    try {
      return await tagsApi.getTag(id)
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async getByFilters(filters: TagFilters): Promise<Tag[]> {
    // Get all tags and filter locally for now
    const allTags = await this.getAll()
    return this.filterTagsLocally(allTags, filters)
  }

  async getByName(name: string): Promise<Tag | null> {
    const allTags = await this.getAll()
    const normalizedName = name.toLowerCase().trim()

    const foundTag = allTags.find(tag =>
      tag.name.toLowerCase().trim() === normalizedName
    )

    return foundTag || null
  }

  async create(data: CreateTagData): Promise<Tag> {
    return await tagsApi.createTag(data)
  }

  async update(id: string, data: UpdateTagData): Promise<Tag> {
    return await tagsApi.updateTag(id, data)
  }

  async delete(id: string): Promise<void> {
    await tagsApi.deleteTag(id)
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id)
    }
  }

  // Private helper method for local filtering
  private filterTagsLocally(tags: Tag[], filters: TagFilters): Tag[] {
    return tags.filter(tag => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (!tag.name.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Color filter
      if (filters.color) {
        if (tag.color !== filters.color) {
          return false
        }
      }

      // Has color filter
      if (filters.hasColor !== undefined) {
        const hasColor = !!tag.color
        if (hasColor !== filters.hasColor) {
          return false
        }
      }

      // Recently created filter
      if (filters.createdInLastDays !== undefined) {
        const createdDate = new Date(tag.createdAt)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - filters.createdInLastDays)

        if (createdDate < cutoffDate) {
          return false
        }
      }

      // Recently used filter - would need task data to implement
      // For now, skip this filter
      if (filters.recentlyUsed !== undefined) {
        // Implementation would require cross-referencing with tasks
        // Skip for now
      }

      // Task count filter - would need task data to implement
      if (filters.taskCount) {
        // Implementation would require cross-referencing with tasks
        // Skip for now
      }

      return true
    })
  }
}