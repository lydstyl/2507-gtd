import { Task, TaskTag } from '../../domain/entities/Task'
import { Tag } from '../../domain/entities/Tag'
import { ValidationError } from '../../shared/errors'
import { logger } from '../../shared/logger'

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
  parentName?: string
  tagNames: string[]
}

export interface ImportResult {
  tasks: ImportTaskData[]
  errors: string[]
}

export class CsvService {
  static exportTasksToCSV(tasks: TaskWithTags[]): string {
    logger.info('Exporting tasks to CSV', { taskCount: tasks.length })

    const headers = [
      'ID',
      'Nom',
      'Lien',
      'Note',
      'Importance',
      'Complexité',
      'Points',
      'Date limite',
      'Date de création',
      'Date de modification',
      'Tâche parente',
      'Nom tâche parente',
      'Tags'
    ]

    const rows = tasks.map((task) => [
      task.id,
      this.escapeCsvField(task.name),
      task.link ? this.escapeCsvField(task.link) : '',
      task.note ? this.escapeCsvField(task.note) : '',
      task.importance,
      task.complexity,
      task.points,
      task.plannedDate ? task.plannedDate.toISOString().split('T')[0] : '',
      task.createdAt.toISOString().split('T')[0],
      task.updatedAt.toISOString().split('T')[0],
      task.parentId || '',
      task.parentName || '',
      task.tags.map((t) => t.tag.name).join(';')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n')

    logger.info('CSV export completed successfully')
    return csvContent
  }

  static importTasksFromCSV(csvContent: string, userId: string): ImportResult {
    logger.info('Starting CSV import', { userId })

    if (!csvContent || csvContent.trim() === '') {
      throw new ValidationError('CSV content cannot be empty')
    }

    const lines = csvContent.split('\n').filter((line) => line.trim())
    if (lines.length < 2) {
      throw new ValidationError('CSV must contain at least a header and one data row')
    }

    const errors: string[] = []
    const tasks: ImportTaskData[] = []

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const columns = this.parseCSVLine(line)

      if (columns.length < 13) {
        errors.push(
          `Line ${i + 1}: Insufficient columns (${columns.length} instead of 13)`
        )
        continue
      }

      try {
        const taskData = this.parseTaskFromColumns(columns, i + 1)
        if (taskData) {
          tasks.push(taskData)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Line ${i + 1}: ${message}`)
      }
    }

    logger.info('CSV import completed', {
      userId,
      tasksImported: tasks.length,
      errorCount: errors.length
    })

    return { tasks, errors }
  }

  private static parseTaskFromColumns(columns: string[], lineNumber: number): ImportTaskData {
    const [
      id, // Ignored during import
      name,
      link,
      note,
      importanceStr,
      complexityStr,
      pointsStr,
      dueDateStr,
      createdAtStr, // Ignored during import
      updatedAtStr, // Ignored during import
      parentId, // Ignored during import
      parentName,
      tagNamesStr
    ] = columns

    // Validate required fields
    if (!name || name.trim() === '') {
      throw new Error('Task name is required')
    }

    const importance = this.parseNumber(importanceStr, 'importance', 0, 50)
    const complexity = this.parseNumber(complexityStr, 'complexity', 1, 9)
    const points = this.parseNumber(pointsStr, 'points', 0, 500)

    let plannedDate: Date | undefined
    if (dueDateStr && dueDateStr.trim() !== '') {
      plannedDate = new Date(dueDateStr)
      if (isNaN(plannedDate.getTime())) {
        throw new Error('Invalid due date format')
      }
    }

    const tagNames = tagNamesStr
      ? tagNamesStr.split(';').filter((tag) => tag.trim() !== '').map(tag => tag.trim())
      : []

    return {
      name: name.trim(),
      link: link && link.trim() !== '' ? link.trim() : undefined,
      note: note && note.trim() !== '' ? note.trim() : undefined,
      importance,
      complexity,
      points,
      plannedDate,
      parentName: parentName && parentName.trim() !== '' ? parentName.trim() : undefined,
      tagNames
    }
  }

  private static parseNumber(value: string, fieldName: string, min: number, max: number): number {
    const parsed = parseInt(value)
    if (isNaN(parsed) || parsed < min || parsed > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`)
    }
    return parsed
  }

  private static escapeCsvField(field: string): string {
    return `"${field.replace(/"/g, '""')}"`
  }

  private static parseCSVLine(line: string): string[] {
    const columns: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Start or end of quotes
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of column
        columns.push(current)
        current = ''
      } else {
        current += char
      }
    }

    // Add the last column
    columns.push(current)

    return columns
  }
}