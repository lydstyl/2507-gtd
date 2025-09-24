export interface CreateTaskRequest {
  name: string
  link?: string
  note?: string
  importance?: number // 1-9, 1 being most important
  urgency?: number // 1-9
  priority?: number // 1-9
  parentId?: string
  tagIds?: string[]
  plannedDate?: string
}

export interface UpdateTaskRequest {
  name?: string
  link?: string
  note?: string
  importance?: number
  urgency?: number
  priority?: number
  parentId?: string
  tagIds?: string[]
  plannedDate?: string
}

export interface CreateTagRequest {
  name: string
  color?: string
}

export interface UpdateTagRequest {
  name?: string
  color?: string
}

export interface TaskWithSubtasks {
  id: string
  name: string
  link?: string
  note?: string | null
  importance: number
  urgency: number
  priority: number
  plannedDate?: Date
  createdAt: Date
  updatedAt: Date
  parentId?: string
  subtasks: TaskWithSubtasks[]
  tags: Tag[]
}

export interface Tag {
  id: string
  name: string
  color?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TaskFilters {
  parentId?: string
  tagIds?: string[]
  importance?: number
  urgency?: number
  priority?: number
  search?: string
}
