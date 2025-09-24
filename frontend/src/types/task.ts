export interface Task {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  plannedDate?: string
  date2?: string
  parentId?: string
  userId: string
  isCompleted: boolean
  completedAt?: string
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
  plannedDate?: string
  date2?: string
  parentId?: string
  tagIds?: string[]
  isCompleted?: boolean
}

export interface UpdateTaskData {
  name?: string
  link?: string
  note?: string
  importance?: number
  complexity?: number
  plannedDate?: string | null
  date2?: string | null
  parentId?: string
  tagIds?: string[]
  isCompleted?: boolean
  completedAt?: string | null
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

export interface CompletionStats {
  dailyCompletions: { date: string; count: number; tasks: { id: string; name: string }[] }[]
  weeklyCompletions: { weekStart: string; count: number }[]
}
