import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters as BaseTaskFilters
} from '../../domain/entities/Task'
import { TaskWithTags as TaskWithTagsForCsv } from '../../application/services/CsvService'
import { BackendTaskRepositoryContract, CompletionStats } from '@gtd/shared'

// Re-export CompletionStats for backward compatibility
export type { CompletionStats }

/**
 * Backend task filters (extends shared TaskFilters)
 */
export interface TaskFilters extends BaseTaskFilters {
  // userId est maintenant obligatoire dans BaseTaskFilters
}

/**
 * Backend task repository interface
 * Extends shared contract with backend-specific types (Date objects)
 */
export interface TaskRepository extends Omit<BackendTaskRepositoryContract<Date>, 'getAllTasksWithTags'> {
  // Override getAllTasksWithTags with backend-specific implementation
  getAllTasksWithTags(userId: string): Promise<TaskWithTagsForCsv[]>
}
