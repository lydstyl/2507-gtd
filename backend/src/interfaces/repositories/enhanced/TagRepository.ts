import { Tag, CreateTagData, UpdateTagData } from '../../../domain/entities/Tag'
import { BaseRepository, PaginationResult, BaseFilters } from '../../../shared/types/Repository'

export interface TagFilters extends BaseFilters {
  userId: string // Always required for security
  name?: string
  color?: string
}

export interface TagRepository extends BaseRepository<Tag, CreateTagData, UpdateTagData, TagFilters> {
  // Enhanced query methods
  findMany(filters?: TagFilters): Promise<Tag[]>
  findWithPagination(filters?: TagFilters): Promise<PaginationResult<Tag>>

  // Specialized methods
  findByName(name: string, userId: string): Promise<Tag | null>
  findByUserId(userId: string): Promise<Tag[]>

  // Utility methods
  existsByName(name: string, userId: string, excludeId?: string): Promise<boolean>
  countByUserId(userId: string): Promise<number>

  // Bulk operations
  deleteAllByUserId(userId: string): Promise<void>
}