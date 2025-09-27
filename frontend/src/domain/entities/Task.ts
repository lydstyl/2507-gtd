// Re-export shared domain entities and types for frontend compatibility
export { TaskEntity, TagEntity, UserEntity } from '@gtd/shared'
export type {
   TaskCategory,
   GenericTaskWithSubtasks as Task,
   GenericTaskWithSubtasks as TaskWithSubtasks,
   TagBase as Tag,
   UserBase as User
} from '@gtd/shared'

// Legacy type aliases for backward compatibility
export type CreateTaskData = {
   name: string
   link?: string
   note?: string
   importance?: number
   complexity?: number
   plannedDate?: string
   dueDate?: string
   parentId?: string
   tagIds?: string[]
   isCompleted?: boolean
}

export type UpdateTaskData = {
   name?: string
   link?: string
   note?: string
   importance?: number
   complexity?: number
   plannedDate?: string | null
   dueDate?: string | null
   parentId?: string
   tagIds?: string[]
   isCompleted?: boolean
   completedAt?: string | null
}