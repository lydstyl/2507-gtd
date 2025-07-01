import { Tag } from './Tag'

export interface Task {
  id: string
  name: string
  link?: string
  importance: number // 1-9, 1 being most important
  urgency: number // 1-9
  priority: number // 1-9
  parentId?: string
  createdAt: Date
  updatedAt: Date
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
}

export interface UpdateTaskData {
  name?: string
  link?: string
  importance?: number
  urgency?: number
  priority?: number
  parentId?: string
  tagIds?: string[]
}

export interface TaskFilters {
  parentId?: string
  tagIds?: string[]
  importance?: number
  urgency?: number
  priority?: number
  search?: string
}
