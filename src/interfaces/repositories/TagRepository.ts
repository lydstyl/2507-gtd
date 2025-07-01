import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'

export interface TagRepository {
  create(data: CreateTagData): Promise<Tag>
  findById(id: string): Promise<Tag | null>
  findAll(): Promise<Tag[]>
  update(id: string, data: UpdateTagData): Promise<Tag>
  delete(id: string): Promise<void>
  findByTaskId(taskId: string): Promise<Tag[]>
}
