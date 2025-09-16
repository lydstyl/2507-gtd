export interface Task {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  dueDate?: string
  parentId?: string
  userId: string
  createdAt: string
  updatedAt: string
  subtasks: Task[]
  tags: Tag[]
}

export interface CreateTaskData {
  name: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  dueDate?: string
  parentId?: string
  tagIds?: string[]
}

export interface UpdateTaskData {
  name?: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  dueDate?: string | null
  parentId?: string
  tagIds?: string[]
}

export interface Tag {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTagData {
  name: string
  color?: string
}
