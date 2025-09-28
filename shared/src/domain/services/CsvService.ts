import { TASK_CONSTANTS } from '../constants/BusinessRules'

/**
 * Generic CSV service for parsing and generating CSV content
 * Platform-agnostic - works with any date type (Date | string)
 */
export interface CsvTaskData<TDate = Date | string> {
  name: string
  link?: string
  note?: string
  importance: number
  complexity: number
  points: number
  plannedDate?: TDate
  dueDate?: TDate
  parentName?: string
  tagNames: string[]
  tagColors?: string[]
}

export interface CsvImportResult<TDate = Date | string> {
  tasks: CsvTaskData<TDate>[]
  errors: string[]
}

export interface CsvTaskWithTags<TDate = Date | string> {
  id: string
  name: string
  link?: string
  note?: string | null
  importance: number
  complexity: number
  points: number
  plannedDate?: TDate
  dueDate?: TDate
  createdAt: TDate
  updatedAt: TDate
  parentId?: string
  parentName?: string
  tags: Array<{
    tag: {
      name: string
      color?: string
    }
  }>
}

export class CsvService {
  /**
   * Export tasks to CSV string format
   */
  static exportTasksToCSV<TDate = Date | string>(
    tasks: CsvTaskWithTags<TDate>[]
  ): string {
    const headers = [
      'ID',
      'Nom',
      'Lien',
      'Note',
      'Importance',
      'Complexité',
      'Points',
      'Date prévue',
      'Date limite',
      'Date de création',
      'Date de modification',
      'Tâche parente',
      'Nom tâche parente',
      'Tags',
      'Couleurs tags'
    ]

    const rows = tasks.map((task) => [
      task.id,
      this.escapeCsvField(task.name),
      task.link ? this.escapeCsvField(task.link) : '',
      task.note ? this.escapeCsvField(task.note) : '',
      task.importance,
      task.complexity,
      task.points,
      task.plannedDate ? this.formatDate(task.plannedDate) : '',
      task.dueDate ? this.formatDate(task.dueDate) : '',
      this.formatDate(task.createdAt),
      this.formatDate(task.updatedAt),
       task.parentId || '',
       task.parentName || '',
       task.tags.map((t) => t.tag.name).join(';'),
       task.tags.map((t) => t.tag.color || '').join(';')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Import tasks from CSV string
   */
  static importTasksFromCSV<TDate = Date | string>(
    csvContent: string,
    dateParser?: (dateStr: string) => TDate
  ): CsvImportResult<TDate> {
    if (!csvContent || csvContent.trim() === '') {
      throw new Error('CSV content cannot be empty')
    }

    const lines = csvContent.split('\n').filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header and one data row')
    }

    const errors: string[] = []
    const tasks: CsvTaskData<TDate>[] = []

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const columns = this.parseCSVLine(line)

      if (columns.length < 15) {
        errors.push(
          `Line ${i + 1}: Insufficient columns (${columns.length} instead of 15)`
        )
        continue
      }

      try {
        const taskData = this.parseTaskFromColumns(columns, i + 1, dateParser)
        if (taskData) {
          tasks.push(taskData)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Line ${i + 1}: ${message}`)
      }
    }

    return { tasks, errors }
  }

  /**
   * Parse task data from CSV columns
   */
  private static parseTaskFromColumns<TDate = Date | string>(
    columns: string[],
    _lineNumber: number,
    dateParser?: (dateStr: string) => TDate
  ): CsvTaskData<TDate> | null {
    const [
      _id, // Ignored during import
      name,
      link,
      note,
      importanceStr,
      complexityStr,
      pointsStr,
      plannedDateStr,
      dueDateStr,
      _createdAtStr, // Ignored during import
      _updatedAtStr, // Ignored during import
      _parentId, // Ignored during import
      parentName,
      tagNamesStr,
      tagColorsStr
    ] = columns

    // Validate required fields
    if (!name || name.trim() === '') {
      throw new Error('Task name is required')
    }

    const importance = this.parseNumber(importanceStr, 'importance', 0, TASK_CONSTANTS.maxImportance)
    const complexity = this.parseNumber(complexityStr, 'complexity', 1, TASK_CONSTANTS.maxComplexity)
    const points = this.parseNumber(pointsStr, 'points', 0, TASK_CONSTANTS.maxPoints)

    let plannedDate: TDate | undefined
    if (plannedDateStr && plannedDateStr.trim() !== '') {
      if (dateParser) {
        plannedDate = dateParser(plannedDateStr)
      } else {
        // Default to string if no parser provided
        plannedDate = plannedDateStr as TDate
      }
    }

    let dueDate: TDate | undefined
    if (dueDateStr && dueDateStr.trim() !== '') {
      if (dateParser) {
        dueDate = dateParser(dueDateStr)
      } else {
        // Default to string if no parser provided
        dueDate = dueDateStr as TDate
      }
    }

    const tagNames = tagNamesStr
      ? tagNamesStr.split(';').filter((tag) => tag.trim() !== '').map(tag => tag.trim())
      : []

    const tagColors = tagColorsStr
      ? tagColorsStr.split(';').filter((color) => color.trim() !== '').map(color => color.trim())
      : []

    return {
      name: name.trim(),
      link: link && link.trim() !== '' ? link.trim() : undefined,
      note: note && note.trim() !== '' ? note.trim() : undefined,
      importance,
      complexity,
      points,
      plannedDate,
      dueDate,
      parentName: parentName && parentName.trim() !== '' ? parentName.trim() : undefined,
      tagNames,
      tagColors
    }
  }

  /**
   * Parse and validate numeric field
   */
  private static parseNumber(value: string, fieldName: string, min: number, max: number): number {
    const parsed = parseInt(value)
    if (isNaN(parsed) || parsed < min || parsed > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`)
    }
    return parsed
  }

  /**
   * Escape CSV field with quotes if necessary
   */
  private static escapeCsvField(field: string): string {
    return `"${field.replace(/"/g, '""')}"`
  }

  /**
   * Parse CSV line handling quoted fields
   */
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

  /**
   * Format date for CSV export
   */
  private static formatDate<TDate = Date | string>(date: TDate): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    // Assume it's already a string in YYYY-MM-DD format
    return date as string
  }
}