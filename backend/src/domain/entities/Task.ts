import { Tag } from './Tag'
import { User } from './User'

export interface Task {
  id: string
  name: string
  link?: string
  importance: number // 1-9, 1 being most important
  urgency: number // 1-9
  priority: number // 1-9
  parentId?: string
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
}

export interface TaskWithSubtasks extends Task {
  subtasks: TaskWithSubtasks[]
  tags: Tag[]
}

export interface CreateTaskData {
  name: string
  link?: string
  importance?: number
  urgency?: number
  priority?: number
  parentId?: string
  tagIds?: string[]
  userId: string
  dueDate?: Date
}

export interface UpdateTaskData {
  name?: string
  link?: string
  importance?: number
  urgency?: number
  priority?: number
  parentId?: string
  tagIds?: string[]
  userId?: string
  dueDate?: Date
}

export interface TaskFilters {
  userId: string // Obligatoire pour la sécurité
  parentId?: string
  tagIds?: string[]
  importance?: number
  urgency?: number
  priority?: number
  search?: string
}
