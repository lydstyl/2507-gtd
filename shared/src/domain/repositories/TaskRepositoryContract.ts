import type { TaskBase, CreateTaskData, UpdateTaskData, TaskFilters, TaskWithSubtasks } from '../entities/TaskTypes'
import type { QueryOptions, CompletionStats } from './RepositoryTypes'

/**
 * Task with tags for CSV export
 */
export interface TaskWithTags<TTask> {
  task: TTask
  tags: string[]
}

/**
 * Base task repository contract
 * Generic over TDate to support both backend (Date) and frontend (string) types
 *
 * This interface defines the common repository operations that both
 * frontend and backend implementations must provide.
 */
export interface TaskRepositoryContract<TDate = Date | string> {
  // ========== Query Operations ==========

  /**
   * Find a task by its ID
   * @param id - Task ID
   * @returns Task with subtasks or null if not found
   */
  findById(id: string): Promise<TaskWithSubtasks<TDate> | null>

  /**
   * Find all tasks matching filters
   * @param filters - Task filter criteria
   * @param options - Query options (pagination, sorting)
   * @returns Array of tasks with subtasks
   */
  findAll(filters: TaskFilters, options?: QueryOptions): Promise<TaskWithSubtasks<TDate>[]>

  /**
   * Find all root tasks (parentId = null) with nested subtasks
   * Used for the main task list view
   * @param filters - Task filter criteria
   * @param options - Query options (pagination, sorting)
   * @returns Array of root tasks with nested subtasks
   */
  findAllRootTasks(filters: TaskFilters, options?: QueryOptions): Promise<TaskWithSubtasks<TDate>[]>

  /**
   * Check if a task exists
   * @param id - Task ID
   * @returns True if task exists, false otherwise
   */
  exists(id: string): Promise<boolean>

  // ========== Command Operations ==========

  /**
   * Create a new task
   * @param data - Task creation data
   * @returns Created task with subtasks
   */
  create(data: CreateTaskData): Promise<TaskWithSubtasks<TDate>>

  /**
   * Update an existing task
   * @param id - Task ID
   * @param data - Task update data
   * @returns Updated task with subtasks
   */
  update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks<TDate>>

  /**
   * Delete a task and its subtasks
   * @param id - Task ID
   */
  delete(id: string): Promise<void>

  // ========== Task-Specific Operations ==========

  /**
   * Mark a task as completed
   * @param id - Task ID
   * @param userId - User ID
   * @returns Updated task with subtasks
   */
  markAsCompleted(id: string, userId: string): Promise<TaskWithSubtasks<TDate>>

  /**
   * Get completion statistics for a user
   * @param userId - User ID
   * @returns Completion statistics
   */
  getCompletionStats(userId: string): Promise<CompletionStats>

  /**
   * Get completed tasks for a date range
   * @param userId - User ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of completed tasks
   */
  getCompletedTasks(userId: string, startDate: TDate, endDate: TDate): Promise<TaskWithSubtasks<TDate>[]>
}

/**
 * Extended task repository contract for backend
 * Includes server-side specific operations
 */
export interface BackendTaskRepositoryContract<TDate = Date> extends TaskRepositoryContract<TDate> {
  /**
   * Get all tasks with tags for CSV export
   * @param userId - User ID
   * @returns Array of tasks with their tag names
   */
  getAllTasksWithTags(userId: string): Promise<TaskWithTags<TaskBase<TDate>>[]>

  /**
   * Delete all tasks for a user
   * Used for cleanup and testing
   * @param userId - User ID
   */
  deleteAllByUserId(userId: string): Promise<void>

  /**
   * Delete old completed tasks
   * Used for data retention policies
   * @param cutoffDate - Delete tasks completed before this date
   * @returns Number of deleted tasks
   */
  deleteOldCompletedTasks(cutoffDate: Date): Promise<number>
}

/**
 * Extended task repository contract for frontend
 * Includes client-side specific operations
 *
 * Note: This interface includes core operations but doesn't extend TaskRepositoryContract
 * to avoid method signature conflicts between client and server patterns
 */
export interface FrontendTaskRepositoryContract<TDate = string> {
  // ========== Core Query Operations (similar to base contract) ==========

  /**
   * Find a task by its ID
   * @param id - Task ID
   * @returns Task with subtasks or null if not found
   */
  findById(id: string): Promise<TaskWithSubtasks<TDate> | null>

  /**
   * Check if a task exists
   * @param id - Task ID
   * @returns True if task exists, false otherwise
   */
  exists(id: string): Promise<boolean>

  // ========== Core Command Operations (similar to base contract) ==========

  /**
   * Create a new task
   * @param data - Task creation data
   * @returns Created task with subtasks
   */
  create(data: CreateTaskData): Promise<TaskWithSubtasks<TDate>>

  /**
   * Update an existing task
   * @param id - Task ID
   * @param data - Task update data
   * @returns Updated task with subtasks
   */
  update(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks<TDate>>

  /**
   * Delete a task and its subtasks
   * @param id - Task ID
   */
  delete(id: string): Promise<void>

  // ========== Frontend-Specific Query Operations ==========

  /**
   * Get all tasks (no filters)
   * @returns Array of all tasks
   */
  getAll(): Promise<TaskBase<TDate>[]>

  /**
   * Get all tasks with subtasks included
   * @returns Array of all tasks with subtasks
   */
  getAllWithSubtasks(): Promise<TaskBase<TDate>[]>

  /**
   * Get root tasks only
   * @returns Array of root tasks (parentId = null)
   */
  getRootTasks(): Promise<TaskBase<TDate>[]>

  /**
   * Get tasks by filters
   * @param filters - Task filter criteria
   * @returns Array of filtered tasks
   */
  getByFilters(filters: TaskFilters): Promise<TaskBase<TDate>[]>

  /**
   * Get completed tasks for the current user
   * @returns Array of completed tasks
   */
  getCompletedTasks(): Promise<TaskBase<TDate>[]>

  /**
   * Update task note
   * @param id - Task ID
   * @param note - Note content
   * @returns Updated task
   */
  updateNote(id: string, note: string): Promise<TaskBase<TDate>>

  /**
   * Delete task note
   * @param id - Task ID
   * @returns Updated task
   */
  deleteNote(id: string): Promise<TaskBase<TDate>>

  /**
   * Mark task as worked on (updates lastWorkedOn timestamp)
   * @param id - Task ID
   * @returns Updated task
   */
  workedOnTask(id: string): Promise<TaskBase<TDate>>

  /**
   * Delete all tasks
   */
  deleteAll(): Promise<void>

  // ========== Bulk Operations ==========

  /**
   * Create multiple tasks
   * @param tasks - Array of task creation data
   * @returns Array of created tasks
   */
  createMany(tasks: CreateTaskData[]): Promise<TaskBase<TDate>[]>

  /**
   * Update multiple tasks
   * @param updates - Array of task updates
   * @returns Array of updated tasks
   */
  updateMany(updates: Array<{ id: string; data: UpdateTaskData }>): Promise<TaskBase<TDate>[]>

  /**
   * Delete multiple tasks
   * @param ids - Array of task IDs
   */
  deleteMany(ids: string[]): Promise<void>

  // ========== Import/Export Operations ==========

  /**
   * Export tasks to CSV
   * @returns CSV file as Blob
   */
  export(): Promise<Blob>

  /**
   * Import tasks from CSV
   * @param csvContent - CSV file content
   * @returns Import result with statistics
   */
  import(csvContent: string): Promise<{ message: string; importedCount: number; errors: string[] }>
}