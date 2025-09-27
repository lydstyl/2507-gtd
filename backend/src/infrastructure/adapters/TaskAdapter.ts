import { TaskWithSubtasks } from '../../domain/entities/Task'
import { Tag } from '../../domain/entities/Tag'
import { BackendTaskWithSubtasks, BackendTag } from '@gtd/shared'

/**
 * Backend-specific adapters for converting between Prisma types and shared domain types
 * Handles the conversion between Date objects (Prisma) and the generic types used in shared domain
 */
export class TaskAdapter {
  /**
   * Convert a backend TaskWithSubtasks to shared domain BackendTaskWithSubtasks
   * This is mainly for type compatibility when using shared domain services
   */
  static toSharedDomain(task: TaskWithSubtasks): BackendTaskWithSubtasks {
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
   * Convert a shared domain BackendTaskWithSubtasks back to backend TaskWithSubtasks
   * This is mainly for compatibility when returning from shared domain services
   */
  static fromSharedDomain(task: BackendTaskWithSubtasks): TaskWithSubtasks {
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
      subtasks: task.subtasks.map(subtask => this.fromSharedDomain(subtask)),
      tags: task.tags.map(tag => this.tagFromSharedDomain(tag))
    }
  }

  /**
   * Convert backend Tag to shared domain BackendTag
   */
  static tagToSharedDomain(tag: Tag): BackendTag {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color || undefined, // Convert null to undefined
      userId: tag.userId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }
  }

  /**
   * Convert shared domain BackendTag back to backend Tag
   * Note: Position field defaults to 0 since shared domain doesn't have it
   */
  static tagFromSharedDomain(tag: BackendTag): Tag {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      position: 0, // Default position since shared domain doesn't have this field
      userId: tag.userId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }
  }
}