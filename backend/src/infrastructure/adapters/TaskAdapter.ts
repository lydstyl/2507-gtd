import { TaskWithSubtasks } from '../../domain/entities/Task'
// Temporarily disabled shared domain conversions due to linking issues
// This adapter currently just passes through data

export class TaskAdapter {
  /**
   * Identity function - passes through data unchanged
   */
  static toSharedDomain<T>(data: T): T {
    return data
  }

  /**
   * Identity function - passes through data unchanged
   */
  static fromSharedDomain<T>(data: T): T {
    return data
  }

  /**
   * Identity function for tags
   */
  static tagToSharedDomain<T>(tag: T): T {
    return tag
  }

  /**
   * Identity function for tags
   */
  static tagFromSharedDomain<T>(tag: T): T {
    return tag
  }
}