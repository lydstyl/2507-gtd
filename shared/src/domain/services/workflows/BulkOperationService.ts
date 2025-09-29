/**
 * Shared bulk operation patterns for batch processing
 */

import type { TaskBase, UpdateTaskData } from '../../entities/TaskTypes'
import type { TagBase, UpdateTagData } from '../../entities/TagTypes'
import type { OperationResult } from '../../types/OperationResult'

export interface BulkOperationResult<T = unknown> {
  /**
   * Successfully processed items
   */
  successful: T[]
  /**
   * Failed items with error messages
   */
  failed: Array<{
    item: T
    error: string
  }>
  /**
   * Summary statistics
   */
  summary: {
    total: number
    successful: number
    failed: number
    successRate: number
  }
}

export interface BulkUpdateRequest<T> {
  /**
   * Item ID
   */
  id: string
  /**
   * Update data
   */
  data: T
}

export class BulkOperationService {
  /**
   * Process items in batches
   */
  static async processBatch<TInput, TOutput>(
    items: TInput[],
    batchSize: number,
    processor: (batch: TInput[]) => Promise<TOutput[]>
  ): Promise<TOutput[]> {
    const results: TOutput[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await processor(batch)
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Create a bulk operation result
   */
  static createBulkResult<T>(
    successful: T[],
    failed: Array<{ item: T; error: string }>
  ): BulkOperationResult<T> {
    const total = successful.length + failed.length
    const successRate = total > 0 ? successful.length / total : 0

    return {
      successful,
      failed,
      summary: {
        total,
        successful: successful.length,
        failed: failed.length,
        successRate
      }
    }
  }

  /**
   * Validate bulk task updates
   */
  static validateBulkTaskUpdates<TDate = Date | string>(
    updates: BulkUpdateRequest<UpdateTaskData>[]
  ): OperationResult<boolean> {
    // Check for duplicate IDs
    const ids = updates.map(u => u.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      return {
        success: false,
        error: { code: "OPERATION_ERROR", message: 'Duplicate task IDs in bulk update'},
        data: false
      }
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id) {
        return {
          success: false,
          error: { code: "OPERATION_ERROR", message: 'Task ID is required for bulk update'},
          data: false
        }
      }

      if (!update.data || Object.keys(update.data).length === 0) {
        return {
          success: false,
          error: { code: "OPERATION_ERROR", message: `No update data provided for task ${update.id}`},
          data: false
        }
      }
    }

    return {
      success: true,
      data: true
    }
  }

  /**
   * Validate bulk tag updates
   */
  static validateBulkTagUpdates<TDate = Date | string>(
    updates: BulkUpdateRequest<UpdateTagData>[]
  ): OperationResult<boolean> {
    // Check for duplicate IDs
    const ids = updates.map(u => u.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      return {
        success: false,
        error: { code: "OPERATION_ERROR", message: 'Duplicate tag IDs in bulk update'},
        data: false
      }
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id) {
        return {
          success: false,
          error: { code: "OPERATION_ERROR", message: 'Tag ID is required for bulk update'},
          data: false
        }
      }

      if (!update.data || Object.keys(update.data).length === 0) {
        return {
          success: false,
          error: { code: "OPERATION_ERROR", message: `No update data provided for tag ${update.id}`},
          data: false
        }
      }
    }

    return {
      success: true,
      data: true
    }
  }

  /**
   * Apply partial updates to tasks
   */
  static applyTaskUpdates<TDate = Date | string>(
    tasks: TaskBase<TDate>[],
    updates: Map<string, Partial<TaskBase<TDate>>>
  ): TaskBase<TDate>[] {
    return tasks.map(task => {
      const update = updates.get(task.id)
      if (update) {
        return { ...task, ...update }
      }
      return task
    })
  }

  /**
   * Apply partial updates to tags
   */
  static applyTagUpdates<TDate = Date | string>(
    tags: TagBase<TDate>[],
    updates: Map<string, Partial<TagBase<TDate>>>
  ): TagBase<TDate>[] {
    return tags.map(tag => {
      const update = updates.get(tag.id)
      if (update) {
        return { ...tag, ...update }
      }
      return tag
    })
  }

  /**
   * Group items by a key function
   */
  static groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
  ): Map<K, T[]> {
    const groups = new Map<K, T[]>()

    for (const item of items) {
      const key = keyFn(item)
      const group = groups.get(key) || []
      group.push(item)
      groups.set(key, group)
    }

    return groups
  }

  /**
   * Calculate batch size based on item count and constraints
   */
  static calculateOptimalBatchSize(
    totalItems: number,
    minBatchSize: number = 10,
    maxBatchSize: number = 100,
    targetBatches: number = 10
  ): number {
    const idealBatchSize = Math.ceil(totalItems / targetBatches)
    return Math.max(minBatchSize, Math.min(maxBatchSize, idealBatchSize))
  }
}