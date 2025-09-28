import { Task, TaskTag } from '../../domain/entities/Task'
import { Tag } from '../../domain/entities/Tag'
import { ValidationError } from '@gtd/shared'
import { CsvFileAdapter } from '../../infrastructure/adapters/CsvFileAdapter'

export interface TaskWithTags extends Omit<Task, 'note'> {
  tags: (TaskTag & { tag: Tag })[]
  parentName?: string
  note: string | null
}

export interface ImportTaskData {
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  plannedDate?: Date
  dueDate?: Date
  parentName?: string
  tagNames: string[]
  tagColors?: string[]
}

export interface ImportResult {
  tasks: ImportTaskData[]
  errors: string[]
}

/**
 * CSV Service - Now uses shared domain logic via CsvFileAdapter
 * @deprecated Consider using CsvFileAdapter directly for new implementations
 */
export class CsvService {
  static exportTasksToCSV(tasks: TaskWithTags[]): string {
    return CsvFileAdapter.exportTasksToCSV(tasks)
  }

  static importTasksFromCSV(csvContent: string, userId: string): ImportResult {
    if (!csvContent || csvContent.trim() === '') {
      throw new ValidationError('CSV content cannot be empty')
    }

    const lines = csvContent.split('\n').filter((line) => line.trim())
    if (lines.length < 2) {
      throw new ValidationError('CSV must contain at least a header and one data row')
    }

    // Use shared adapter for parsing
    const result = CsvFileAdapter.importTasksFromCSV(csvContent, userId)

    // Convert shared types to backend types
    const tasks: ImportTaskData[] = result.tasks.map((task: any) => ({
      name: task.name,
      link: task.link,
      note: task.note,
      importance: task.importance,
      complexity: task.complexity,
      points: task.points,
      plannedDate: task.plannedDate,
      dueDate: task.dueDate,
      parentName: task.parentName,
      tagNames: task.tagNames,
      tagColors: task.tagColors
    }))

    return { tasks, errors: result.errors }
  }
}