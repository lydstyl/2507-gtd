import { CsvService } from '@gtd/shared'

interface CsvImportResult<TDate = Date | string> {
  tasks: Array<{
    name: string
    link?: string
    note?: string
    importance: number
    complexity: number
    points: number
    plannedDate?: TDate
    parentName?: string
    tagNames: string[]
  }>
  errors: string[]
}

/**
 * Frontend adapter for CSV operations in the browser
 * Handles download/upload operations using browser APIs
 */
export class CsvBrowserAdapter {
  /**
   * Download CSV content as a file in the browser
   */
  static downloadCsv(csvContent: string, filename: string = 'tasks-export.csv'): void {
    console.log('📄 Preparing CSV download:', csvContent.length, 'characters')

    // Create blob with CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    link.style.display = 'none'

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    window.URL.revokeObjectURL(url)

    console.log('✅ CSV download initiated:', filename)
  }

  /**
   * Read CSV content from a File object
   */
  static async readCsvFile(file: File): Promise<string> {
    console.log('📄 Reading CSV file:', file.name, file.size, 'bytes')

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const content = event.target?.result as string
        console.log('✅ CSV file read successfully')
        resolve(content)
      }

      reader.onerror = () => {
        console.error('❌ Error reading CSV file')
        reject(new Error('Failed to read CSV file'))
      }

      reader.readAsText(file, 'utf-8')
    })
  }

  /**
   * Import tasks from CSV string using frontend-specific types (string dates)
   */
  static importTasksFromCSV(csvContent: string): CsvImportResult<string> {
    console.log('🔄 Starting CSV import via browser adapter')

    // Parse CSV using shared service with string date handling
    const result = CsvService.importTasksFromCSV<string>(
      csvContent,
      (dateStr: string) => dateStr // Keep as string for frontend
    )

    console.log('✅ CSV import completed via browser adapter', {
      tasksImported: result.tasks.length,
      errorCount: result.errors.length
    })

    return result
  }
}