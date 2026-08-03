import type { TaskCategory } from '@gtd/shared'
import { TaskCategoryService, TaskPriorityService } from '@gtd/shared'

// Re-export for backward compatibility
export type { TaskCategory }

/**
 * Importance quadrant system (100-499)
 * Encodes both importance AND urgency in a single value:
 *   - 100-199: non-important, non-urgent  🐢
 *   - 200-299: urgent, non-important      ⚡
 *   - 300-399: important, non-urgent      📌
 *   - 400-499: important AND urgent       🔥
 */
export interface ImportanceQuadrant {
  label: string
  shortLabel: string
  emoji: string
  colorClass: string
  borderColor: string
  badgeClass: string
  min: number
  max: number
}

export const IMPORTANCE_MIN = 100
export const IMPORTANCE_MAX = 499

export const IMPORTANCE_QUADRANTS: ImportanceQuadrant[] = [
  {
    label: 'Non importante · Non urgente',
    shortLabel: 'Basique',
    emoji: '🐢',
    colorClass: 'bg-gray-400',
    borderColor: 'border-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700',
    min: 100,
    max: 199
  },
  {
    label: 'Urgente · Non importante',
    shortLabel: 'Urgente',
    emoji: '⚡',
    colorClass: 'bg-orange-500',
    borderColor: 'border-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700',
    min: 200,
    max: 299
  },
  {
    label: 'Importante · Non urgente',
    shortLabel: 'Importante',
    emoji: '📌',
    colorClass: 'bg-blue-500',
    borderColor: 'border-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
    min: 300,
    max: 399
  },
  {
    label: 'Importante · Urgente',
    shortLabel: 'Critique',
    emoji: '🔥',
    colorClass: 'bg-red-500',
    borderColor: 'border-red-500',
    badgeClass: 'bg-red-100 text-red-700',
    min: 400,
    max: 499
  }
]

export const getImportanceQuadrant = (importance: number): ImportanceQuadrant => {
  const clamped = Math.max(IMPORTANCE_MIN, Math.min(IMPORTANCE_MAX, importance))
  return IMPORTANCE_QUADRANTS.find(q => clamped >= q.min && clamped <= q.max) ?? IMPORTANCE_QUADRANTS[0]
}

export const getPriorityColor = (importance: number): string => {
  return getImportanceQuadrant(importance).colorClass
}

export const getImportanceBadge = (importance: number): string => {
  const q = getImportanceQuadrant(importance)
  return `${q.emoji} ${q.shortLabel}`
}

// Legacy alias — points system removed
export const getPointsColor = (_points: number): string => {
  return 'bg-gray-300'
}

import { formatDate, isOverdue, isDueDateUrgent, getDayOfWeek } from '@gtd/shared'

export { formatDate, isOverdue, isDueDateUrgent, getDayOfWeek }

export const getDateIndicator = (dateString: string) => {
  return TaskCategoryService.getDateIndicator(dateString)
}

export const getTaskCategory = (task: { importance: number; complexity: number; status?: string; plannedDate?: string | Date | null; dueDate?: string | Date | null }): TaskCategory => {
  const genericTask = {
    id: 'temp',
    name: 'temp',
    importance: task.importance,
    complexity: task.complexity,
    position: 0,
    status: task.status ?? 'brouillon',
    plannedDate: task.plannedDate || undefined,
    dueDate: task.dueDate || undefined,
    parentId: undefined,
    userId: 'temp',
    isCompleted: false,
    completedAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [],
    tags: []
  }

  const dateContext = TaskPriorityService.createDateContext()
  return TaskPriorityService.getTaskCategory(genericTask as any, dateContext)
}

export const getTaskCategoryStyle = (category: TaskCategory) => {
  const displayInfo = TaskCategoryService.getCategoryDisplayInfo(category)
  return {
    borderColor: displayInfo.borderColor,
    backgroundColor: displayInfo.backgroundColor,
    label: displayInfo.label,
    textColor: displayInfo.textColor
  }
}
