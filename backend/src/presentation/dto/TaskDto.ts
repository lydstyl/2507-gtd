export interface TaskDto {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  urgency: number
  priority: number
  parentId?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  userId: string
  subtasks: TaskDto[]
  tags: TagDto[]
}

export interface TagDto {
  id: string
  name: string
  color?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateTaskDto {
  name: string
  link?: string
  note?: string
  importance?: number
  urgency?: number
  priority?: number
  parentId?: string
  tagIds?: string[]
  dueDate?: string
}

export interface UpdateTaskDto {
  name?: string
  link?: string
  note?: string
  importance?: number
  urgency?: number
  priority?: number
  parentId?: string
  tagIds?: string[]
  dueDate?: string | null
}

export interface CreateTagDto {
  name: string
  color?: string
}

export interface UpdateTagDto {
  name?: string
  color?: string
}

export interface TaskFiltersDto {
  parentId?: string
  tagIds?: string[]
  importance?: number
  urgency?: number
  priority?: number
  search?: string
  includeSubtasks?: boolean
}