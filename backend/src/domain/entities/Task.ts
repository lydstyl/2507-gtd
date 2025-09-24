import { Tag } from './Tag'
import { User } from './User'

export interface Task {
  id: string
  name: string
  link?: string
  note?: string // Optional rich text note
  importance: number // 0-50, higher = more important
  complexity: number // 1-9, higher = more complex
  points: number // Computed: round(10 * importance / complexity), clamped to [0, 500]
   parentId?: string
   plannedDate?: Date
   dueDate?: Date
   isCompleted: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
}

export interface TaskTag {
  id: string
  taskId: string
  tagId: string
  task?: Task
  tag?: Tag
}

export interface TaskWithSubtasks extends Task {
  subtasks: TaskWithSubtasks[]
  tags: Tag[]
}

export interface CreateTaskData {
  name: string
  link?: string
  note?: string // Optional rich text note
  importance?: number // 0-50, defaults to 50
  complexity?: number // 1-9, defaults to 1
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
  note?: string // Optional rich text note
  importance?: number // 0-50
  complexity?: number // 1-9
  parentId?: string
  tagIds?: string[]
   userId?: string
   plannedDate?: Date | null
   dueDate?: Date | null
   isCompleted?: boolean
  completedAt?: Date | null
}

export interface TaskFilters {
  userId: string // Obligatoire pour la sécurité
  parentId?: string
  tagIds?: string[]
  importance?: number // 0-50
  complexity?: number // 1-9
  points?: number // 0-500
  search?: string
}
