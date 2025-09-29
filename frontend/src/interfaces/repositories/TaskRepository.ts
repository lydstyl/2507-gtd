import { Task, CreateTaskData, UpdateTaskData } from '../../domain/entities/Task'
import { FrontendTaskRepositoryContract } from '@gtd/shared'

/**
 * Frontend task repository interface
 * Extends shared contract with frontend-specific types (string dates)
 */
export interface TaskRepository extends FrontendTaskRepositoryContract<string> {
  // All methods inherited from FrontendTaskRepositoryContract
  // The interface is now aligned with the shared contract
}