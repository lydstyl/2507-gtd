/**
 * Shared types and enums for the GTD domain
 */

export type TaskCategory = 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future'

export interface DateContext {
  today: Date
  tomorrow: Date
  dayAfterTomorrow: Date
}

/**
 * Generic Task interface that works with both Date objects (backend) and strings (frontend)
 */
export interface TaskBase<TDate = Date | string> {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  plannedDate?: TDate
  dueDate?: TDate
  parentId?: string
  userId: string
  isCompleted: boolean
  completedAt?: TDate
  createdAt: TDate
  updatedAt: TDate
}

/**
 * Generic Task with subtasks
 */
export interface TaskWithSubtasks<TDate = Date | string> extends TaskBase<TDate> {
  subtasks: TaskWithSubtasks<TDate>[]
  tags: TagBase<TDate>[]
}

/**
 * Generic Tag interface
 */
export interface TagBase<TDate = Date | string> {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: TDate
  updatedAt: TDate
}

/**
 * Type aliases for specific contexts
 */

// Backend types (using Date objects from database)
export type BackendTask = TaskBase<Date>
export type BackendTaskWithSubtasks = TaskWithSubtasks<Date>
export type BackendTag = TagBase<Date>

// Frontend types (using string dates from JSON API)
export type FrontendTask = TaskBase<string>
export type FrontendTaskWithSubtasks = TaskWithSubtasks<string>
export type FrontendTag = TagBase<string>

// Generic types for domain services
export type GenericTask<TDate = Date | string> = TaskBase<TDate>
export type GenericTaskWithSubtasks<TDate = Date | string> = TaskWithSubtasks<TDate>