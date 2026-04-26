export interface TagDto {
  id: string
  name: string
  color: string | null
  position: number
  userId: string
  createdAt: string
  updatedAt: string
}

export interface TaskDto {
  id: string
  name: string
  link: string | null
  note: string | null
  importance: number
  complexity: number
  points: number
  plannedDate: string | null
  dueDate: string | null
  status: string
  isCompleted: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
  userId: string
  parentId: string | null
  tags: TagDto[]
  subtasks?: TaskDto[]
}

export interface CreateTaskDto {
  name: string
  importance?: number
  complexity?: number
  link?: string
  note?: string
  plannedDate?: string
  dueDate?: string
  parentId?: string
  tagIds?: string[]
}

export interface UpdateTaskDto {
  name?: string
  importance?: number
  complexity?: number
  link?: string | null
  note?: string | null
  plannedDate?: string | null
  dueDate?: string | null
  isCompleted?: boolean
  tagIds?: string[]
}

export interface CreateTagDto {
  name: string
  color?: string
}

export interface UpdateTagDto {
  name?: string
  color?: string | null
}

export interface TaskQueryParams {
  isCompleted?: boolean
  search?: string
  parentId?: string
  limit?: number
}
