export interface Task {
  id: string
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  position: number
  plannedDate?: string
  dueDate?: string
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
   dueDate?: string
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
  position?: number
  plannedDate?: string | null
  dueDate?: string | null
  parentId?: string
  tagIds?: string[]
  isCompleted?: boolean
  completedAt?: string | null
}

// Frontend tag interface with position field (for UI ordering)
import type { FrontendTag } from '@gtd/shared'

export interface Tag extends FrontendTag {
  position: number
}

// Frontend-specific tag creation data (userId is handled by auth context)
export interface CreateTagData {
  name: string
  color?: string
}

export interface CompletionStats {
  dailyCompletions: { date: string; count: number; tasks: { id: string; name: string }[] }[]
  weeklyCompletions: { weekStart: string; count: number }[]
}
