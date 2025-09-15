import {
  Task,
  TaskWithSubtasks,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters as BaseTaskFilters
} from '../../../domain/entities/Task'
import { TaskWithTags } from '../../../application/services'
import { BaseRepository, PaginationResult, BaseFilters } from '../../../shared/types/Repository'

export interface TaskFilters extends BaseTaskFilters, BaseFilters {
  userId: string // Always required for security
}

export interface TaskQueryOptions {
  includeSubtasks?: boolean
  includeParent?: boolean
  includeTags?: boolean
  maxDepth?: number
}

export interface TaskRepository extends BaseRepository<TaskWithSubtasks, CreateTaskData, UpdateTaskData, TaskFilters> {
  // Enhanced query methods
  findById(id: string, options?: TaskQueryOptions): Promise<TaskWithSubtasks | null>
  findMany(filters?: TaskFilters, options?: TaskQueryOptions): Promise<TaskWithSubtasks[]>
  findWithPagination(filters?: TaskFilters, options?: TaskQueryOptions): Promise<PaginationResult<TaskWithSubtasks>>

  // Specialized methods
  findAllRootTasks(filters: TaskFilters, options?: TaskQueryOptions): Promise<TaskWithSubtasks[]>
  findSubtasks(parentId: string, filters?: Omit<TaskFilters, 'parentId'>): Promise<TaskWithSubtasks[]>
  findByUserId(userId: string, filters?: Omit<TaskFilters, 'userId'>): Promise<TaskWithSubtasks[]>

  // CSV and export methods
  getAllTasksWithTags(userId: string): Promise<TaskWithTags[]>

  // Bulk operations
  deleteAllByUserId(userId: string): Promise<void>
  bulkUpdate(updates: Array<{ id: string; data: UpdateTaskData }>): Promise<TaskWithSubtasks[]>

  // Utility methods
  existsByName(name: string, userId: string, excludeId?: string): Promise<boolean>
  countByUserId(userId: string): Promise<number>
  getTaskDepth(taskId: string): Promise<number>
}