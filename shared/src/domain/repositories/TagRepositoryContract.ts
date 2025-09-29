import type { TagBase, CreateTagData, UpdateTagData, TagFilters } from '../entities/TagTypes'
import type { QueryOptions } from './RepositoryTypes'

/**
 * Base tag repository contract
 * Generic over TDate to support both backend (Date) and frontend (string) types
 *
 * This interface defines the common repository operations that both
 * frontend and backend implementations must provide.
 */
export interface TagRepositoryContract<TDate = Date | string> {
  // ========== Query Operations ==========

  /**
   * Find a tag by its ID
   * @param id - Tag ID
   * @returns Tag or null if not found
   */
  findById(id: string): Promise<TagBase<TDate> | null>

  /**
   * Find all tags for a user
   * @param userId - User ID
   * @param options - Query options (pagination, sorting)
   * @returns Array of tags
   */
  findAll(userId: string, options?: QueryOptions): Promise<TagBase<TDate>[]>

  /**
   * Find a tag by name and user
   * Used to prevent duplicate tag names for a user
   * @param name - Tag name
   * @param userId - User ID
   * @returns Tag or null if not found
   */
  findByNameAndUser(name: string, userId: string): Promise<TagBase<TDate> | null>

  // ========== Command Operations ==========

  /**
   * Create a new tag
   * @param data - Tag creation data
   * @returns Created tag
   */
  create(data: CreateTagData): Promise<TagBase<TDate>>

  /**
   * Update an existing tag
   * @param id - Tag ID
   * @param data - Tag update data
   * @returns Updated tag
   */
  update(id: string, data: UpdateTagData): Promise<TagBase<TDate>>

  /**
   * Delete a tag
   * @param id - Tag ID
   */
  delete(id: string): Promise<void>

  // ========== Tag-Specific Operations ==========

  /**
   * Find tags associated with a task
   * @param taskId - Task ID
   * @returns Array of tags
   */
  findByTaskId(taskId: string): Promise<TagBase<TDate>[]>
}

/**
 * Extended tag repository contract for backend
 * Includes server-side specific operations
 */
export interface BackendTagRepositoryContract<TDate = Date> extends TagRepositoryContract<TDate> {
  /**
   * Update tag positions for a user
   * Used for drag-and-drop reordering
   * @param userId - User ID
   * @param tagPositions - Array of tag ID and position pairs
   */
  updatePositions(userId: string, tagPositions: { id: string; position: number }[]): Promise<void>
}

/**
 * Extended tag repository contract for frontend
 * Includes client-side specific operations
 */
export interface FrontendTagRepositoryContract<TDate = string> extends TagRepositoryContract<TDate> {
  /**
   * Get all tags (no user filter, handled by auth context)
   * @returns Array of all tags
   */
  getAll(): Promise<TagBase<TDate>[]>

  /**
   * Get tag by ID (alias for findById)
   * @param id - Tag ID
   * @returns Tag or null if not found
   */
  getById(id: string): Promise<TagBase<TDate> | null>

  /**
   * Get tags by filters
   * @param filters - Tag filter criteria
   * @returns Array of filtered tags
   */
  getByFilters(filters: TagFilters): Promise<TagBase<TDate>[]>

  /**
   * Get tag by name (alias for findByNameAndUser with auto user)
   * @param name - Tag name
   * @returns Tag or null if not found
   */
  getByName(name: string): Promise<TagBase<TDate> | null>

  // ========== Bulk Operations ==========

  /**
   * Delete multiple tags
   * @param ids - Array of tag IDs
   */
  deleteMany(ids: string[]): Promise<void>
}