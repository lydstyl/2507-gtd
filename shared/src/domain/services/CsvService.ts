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
  status?: string
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
  status: string
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
      'Statut',
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
      this.escapeCsvField(task.status),
      task.plannedDate ? this.formatDate(task.plannedDate) : '',
      task.dueDate ? this.formatDate(task.dueDate) : '',
      this.formatDate(task.createdAt),
      this.formatDate(task.updatedAt),
      task.parentId ? this.escapeCsvField(task.parentId) : '',
      task.parentName ? this.escapeCsvField(task.parentName) : '',
      this.escapeCsvField(task.tags.map((t) => t.tag.name).join(';')),
      this.escapeCsvField(task.tags.map((t) => t.tag.color || '').join(';'))
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Import tasks from CSV string — handles multi-line quoted fields
   */
  static importTasksFromCSV<TDate = Date | string>(
    csvContent: string,
    dateParser?: (dateStr: string) => TDate
  ): CsvImportResult<TDate> {
    if (!csvContent || csvContent.trim() === '') {
      throw new Error('CSV content cannot be empty')
    }

    const rows = this.parseCSVRows(csvContent)
    if (rows.length < 2) {
      throw new Error('CSV must contain at least a header and one data row')
    }

    const errors: string[] = []
    const tasks: CsvTaskData<TDate>[] = []

    // Skip header row (index 0)
    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i]

      if (columns.length < 15) {
        errors.push(
          `Row ${i + 1}: Insufficient columns (${columns.length} instead of 15)`
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
        errors.push(`Row ${i + 1}: ${message}`)
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
    // Support both old format (15 cols, no Statut) and new format (16 cols, with Statut)
    const hasStatus = columns.length >= 16
    const [
      _id, // Ignored during import
      name,
      link,
      note,
      importanceStr,
      complexityStr,
      pointsStr,
      statusOrPlannedDateStr,
      plannedDateStrOrDueDate,
      dueDateStrOrCreatedAt,
      _createdAtStr, // Ignored during import
      _updatedAtStr, // Ignored during import
      _parentId, // Ignored during import
      parentName,
      tagNamesStr,
      tagColorsStr
    ] = columns

    // Adjust column positions based on format
    const statusStr = hasStatus ? statusOrPlannedDateStr : undefined
    const plannedDateStr = hasStatus ? plannedDateStrOrDueDate : statusOrPlannedDateStr
    const dueDateStrRaw = hasStatus ? dueDateStrOrCreatedAt : plannedDateStrOrDueDate

    // Validate required fields
    if (!name || name.trim() === '') {
      throw new Error('Task name is required')
    }

    const importance = this.parseNumber(importanceStr, 'importance', 0, TASK_CONSTANTS.maxImportance)
    const complexity = this.parseNumber(complexityStr, 'complexity', 1, TASK_CONSTANTS.maxComplexity)
    // Recalculate points from importance/complexity, ignoring CSV points column
    const points = complexity === 0
      ? 0
      : Math.min(Math.round(10 * importance / complexity), TASK_CONSTANTS.maxPoints)

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
    if (dueDateStrRaw && dueDateStrRaw.trim() !== '') {
      if (dateParser) {
        dueDate = dateParser(dueDateStrRaw)
      } else {
        // Default to string if no parser provided
        dueDate = dueDateStrRaw as TDate
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
      status: statusStr && statusStr.trim() !== '' ? statusStr.trim() : undefined,
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
   * Escape CSV field with quotes (always quoted to handle commas, newlines, quotes)
   */
  private static escapeCsvField(field: string): string {
    return `"${field.replace(/"/g, '""')}"`
  }

  /**
   * Parse entire CSV content into rows and columns.
   * Correctly handles quoted fields that contain commas or newlines.
   */
  private static parseCSVRows(content: string): string[][] {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      const next = content[i + 1]

      if (char === '"') {
        if (inQuotes && next === '"') {
          currentField += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField)
        currentField = ''
      } else if (!inQuotes && (char === '\n' || char === '\r')) {
        if (char === '\r' && next === '\n') i++
        currentRow.push(currentField)
        currentField = ''
        if (currentRow.length > 1 || currentRow[0] !== '') {
          rows.push(currentRow)
        }
        currentRow = []
      } else {
        currentField += char
      }
    }

    // Flush last row
    if (currentRow.length > 0 || currentField !== '') {
      currentRow.push(currentField)
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow)
      }
    }

    return rows
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