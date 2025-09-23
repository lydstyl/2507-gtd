import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'
import { TagFilters } from '../../domain/types/TagTypes'

export interface TagRepository {
  // Query operations
  getAll(): Promise<Tag[]>
  getById(id: string): Promise<Tag | null>
  getByFilters(filters: TagFilters): Promise<Tag[]>
  getByName(name: string): Promise<Tag | null>

  // Command operations
  create(data: CreateTagData): Promise<Tag>
  update(id: string, data: UpdateTagData): Promise<Tag>
  delete(id: string): Promise<void>

  // Bulk operations
  deleteMany(ids: string[]): Promise<void>
}