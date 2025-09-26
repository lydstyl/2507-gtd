import { Tag, CreateTagData, UpdateTagData } from '../../domain/entities/Tag'

export interface TagRepository {
  /**
   * Crée un tag pour un utilisateur
   */
  create(data: CreateTagData): Promise<Tag>
  findById(id: string): Promise<Tag | null>
  findAll(userId: string): Promise<Tag[]>
  /**
   * Trouve un tag par nom et utilisateur
   */
  findByNameAndUser(name: string, userId: string): Promise<Tag | null>
  update(id: string, data: UpdateTagData): Promise<Tag>
  delete(id: string): Promise<void>
  findByTaskId(taskId: string): Promise<Tag[]>
  /**
   * Met à jour les positions des tags pour un utilisateur
   */
  updatePositions(userId: string, tagPositions: { id: string; position: number }[]): Promise<void>
}
