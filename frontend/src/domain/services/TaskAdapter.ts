import type { Task, TaskEntity } from '../entities/Task'
import type { Tag } from '../entities/Tag'
import type { FrontendTaskWithSubtasks, FrontendTag } from '@gtd/shared'

/**
 * Adapter for converting between frontend Task entities and shared domain types
 * Handles conversion between string dates (from API) and shared domain types
 */
export class TaskAdapter {
  /**
   * Convert a frontend Task to shared domain type
   */
  static toSharedDomain(task: Task): FrontendTaskWithSubtasks {
    return {
      id: task.id,
      name: task.name,
      link: task.link,
      note: task.note,
      importance: task.importance,
      complexity: task.complexity,
      points: task.points,
      plannedDate: task.plannedDate,
      dueDate: task.dueDate,
      parentId: task.parentId,
      userId: task.userId,
      isCompleted: task.isCompleted,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      subtasks: task.subtasks.map(subtask => this.toSharedDomain(subtask)),
      tags: task.tags.map(tag => this.tagToSharedDomain(tag))
    }
  }

  /**
   * Convert a frontend Tag to shared domain type
   */
  static tagToSharedDomain(tag: Tag): FrontendTag {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      userId: tag.userId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }
  }

  /**
   * Convert a TaskEntity to shared domain type
   */
  static entityToSharedDomain(entity: TaskEntity): FrontendTaskWithSubtasks {
    return this.toSharedDomain(entity.rawTask)
  }

  /**
   * Convert multiple TaskEntities to shared domain types
   */
  static entitiesToSharedDomain(entities: TaskEntity[]): FrontendTaskWithSubtasks[] {
    return entities.map(entity => this.entityToSharedDomain(entity))
  }
}