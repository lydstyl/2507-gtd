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
    // Support 3 formats:
    //  - 16 cols (legacy): ... Importance, Complexité, Points, Statut, Date prévue, ...
    //  - 15 cols (new):     ... Importance, Complexité, Statut, Date prévue, ...  (no Points)
    //  - 15 cols (legacy):  ... Importance, Complexité, Points, Date prévue, ...  (no Statut)
    const KNOWN_STATUSES = ['brouillon', 'pour_ia', 'collecte', 'pret', 'un_jour_peut_etre', 'completed']
    const col6 = columns[6] ? columns[6].trim() : ''

    // Detect format: if column 7 (index 6) is a known status → new 15-col format (Statut without Points)
    const hasStatusAtCol6 = KNOWN_STATUSES.includes(col6)
    // If 16 columns → legacy format with both Points AND Statut
    const hasPointsAndStatus = columns.length >= 16

    // Extract columns positionally
    let importanceStr: string
    let complexityStr: string
    let statusStr: string | undefined
    let plannedDateStr: string | undefined
    let dueDateStrRaw: string | undefined
    let parentName: string | undefined
    let tagNamesStr: string | undefined
    let tagColorsStr: string | undefined

    const name = columns[1]?.trim()
    const link = columns[2]?.trim()
    const note = columns[3]?.trim()

    if (hasPointsAndStatus) {
      // Legacy 16-col: Importance(4), Complexité(5), Points(6), Statut(7), Date prévue(8), Date limite(9), ..., Parent(13), Nom parent(14), Tags(15), Couleurs(16)
      importanceStr = columns[4]
      complexityStr = columns[5]
      statusStr = columns[7]?.trim() || undefined
      plannedDateStr = columns[8]?.trim() || undefined
      dueDateStrRaw = columns[9]?.trim() || undefined
      parentName = columns[13]?.trim() || undefined
      tagNamesStr = columns[14]?.trim() || undefined
      tagColorsStr = columns[15]?.trim() || undefined
    } else if (hasStatusAtCol6) {
      // New 15-col: Importance(4), Complexité(5), Statut(6), Date prévue(7), Date limite(8), ..., Parent(12), Nom parent(13), Tags(14), Couleurs(15)
      importanceStr = columns[4]
      complexityStr = columns[5]
      statusStr = col6 || undefined
      plannedDateStr = columns[7]?.trim() || undefined
      dueDateStrRaw = columns[8]?.trim() || undefined
      parentName = columns[12]?.trim() || undefined
      tagNamesStr = columns[13]?.trim() || undefined
      tagColorsStr = columns[14]?.trim() || undefined
    } else {
      // Legacy 15-col (no Statut): Importance(4), Complexité(5), Points(6), Date prévue(7), Date limite(8), ..., Parent(12), Nom parent(13), Tags(14), Couleurs(15)
      importanceStr = columns[4]
      complexityStr = columns[5]
      plannedDateStr = columns[7]?.trim() || undefined
      dueDateStrRaw = columns[8]?.trim() || undefined
      parentName = columns[12]?.trim() || undefined
      tagNamesStr = columns[13]?.trim() || undefined
      tagColorsStr = columns[14]?.trim() || undefined
    }

    // Validate required fields
    if (!name || name.trim() === '') {
      throw new Error('Task name is required')
    }

    const importance = this.parseNumber(importanceStr, 'importance', 0, TASK_CONSTANTS.maxImportance)
    const complexity = this.parseNumber(complexityStr, 'complexity', 1, TASK_CONSTANTS.maxComplexity)

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