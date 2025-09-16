export interface Task {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  isCollection: boolean
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
  isCollection?: boolean
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
  isCollection?: boolean
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
