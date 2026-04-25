// Re-export shared domain entities and types for backend compatibility
export { TaskEntity, TagEntity, UserEntity } from '@gtd/shared'
export type {
   BackendTask as Task,
   BackendTaskWithSubtasks as TaskWithSubtasks,
   BackendTag as Tag,
   BackendUser as User,
   TaskStatus
} from '@gtd/shared'

// Import types for use in legacy interfaces
import type { BackendTask, BackendTag, TaskStatus } from '@gtd/shared'

// Legacy interfaces for backward compatibility
export interface TaskTag {
   id: string
   taskId: string
   tagId: string
   task?: BackendTask
   tag?: BackendTag
}

export interface CreateTaskData {
   name: string
   link?: string
   note?: string
   importance?: number
   complexity?: number
   status?: TaskStatus
   parentId?: string
   tagIds?: string[]
   userId: string
   plannedDate?: Date
   dueDate?: Date
   isCompleted?: boolean
}

export interface UpdateTaskData {
   name?: string
   link?: string
   note?: string
   importance?: number
   complexity?: number
   status?: TaskStatus
   parentId?: string
   tagIds?: string[]
   userId?: string
   plannedDate?: Date | null
   dueDate?: Date | null
   isCompleted?: boolean
   completedAt?: Date | null
}

export interface TaskFilters {
  userId: string
  parentId?: string
  tagIds?: string[]
  importance?: number
  complexity?: number
  points?: number
  search?: string
}
