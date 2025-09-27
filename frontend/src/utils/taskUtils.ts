import type { TaskCategory } from '@gtd/shared'
import { TaskCategoryService, TaskPriorityService } from '@gtd/shared'

// Re-export for backward compatibility
export type { TaskCategory }

export const getPriorityColor = (importance: number): string => {
  return TaskCategoryService.getPriorityColor(importance)
}

export const getPointsColor = (points: number): string => {
  return TaskCategoryService.getPointsColor(points)
}

import { formatDate, isOverdue, isDueDateUrgent, getDayOfWeek } from '@gtd/shared'

export { formatDate, isOverdue, isDueDateUrgent, getDayOfWeek }

export const getDateIndicator = (dateString: string) => {
  return TaskCategoryService.getDateIndicator(dateString)
}

export const getTaskCategory = (task: { points: number; importance: number; complexity: number; plannedDate?: string | Date | null; dueDate?: string | Date | null }): TaskCategory => {
  // Create a minimal task object for the shared service
  const genericTask = {
    id: 'temp',
    name: 'temp',
    importance: task.importance,
    complexity: task.complexity,
    points: task.points,
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
  return TaskPriorityService.getTaskCategory(genericTask, dateContext)
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