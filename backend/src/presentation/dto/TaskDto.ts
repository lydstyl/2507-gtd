export interface TaskDto {
  id: string
  name: string
  link?: string
  note?: string
  importance: number // 0-50
  complexity: number // 1-9
  points: number // 0-500, computed server-side
  isCollection: boolean
  parentId?: string
  plannedDate?: string
  date2?: string
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
  importance?: number // 0-50, defaults to 20
  complexity?: number // 1-9, defaults to 5
  isCollection?: boolean // Defaults to false
  parentId?: string
  tagIds?: string[]
  plannedDate?: string
  date2?: string
}

export interface UpdateTaskDto {
  name?: string
  link?: string
  note?: string
  importance?: number // 0-50
  complexity?: number // 1-9
  isCollection?: boolean
  parentId?: string
  tagIds?: string[]
  plannedDate?: string | null
  date2?: string | null
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
  importance?: number // 0-50
  complexity?: number // 1-9
  points?: number // 0-500
  isCollection?: boolean
  search?: string
  includeSubtasks?: boolean
}