import { CsvService } from '@gtd/shared'
import { CsvImportResult, CsvTaskWithTags } from '@gtd/shared/dist/esm/domain/services/CsvService'
import { TaskWithTags } from '../../application/services/CsvService'
import { logger } from '../../shared/logger'

/**
 * Backend adapter for CSV operations using file I/O
 * Handles conversion between backend Date objects and shared service types
 */
export class CsvFileAdapter {
  /**
   * Export tasks to CSV string using backend-specific types
   */
  static exportTasksToCSV(tasks: TaskWithTags[]): string {
    logger.info('Exporting tasks to CSV via file adapter', { taskCount: tasks.length })

    // Convert backend types to shared types
    const sharedTasks: CsvTaskWithTags<Date>[] = tasks.map(task => ({
      id: task.id,
      name: task.name,
      link: task.link || undefined,
      note: task.note,
      importance: task.importance,
      complexity: task.complexity,
      points: task.points,
      plannedDate: task.plannedDate || undefined,
      dueDate: (task as any).dueDate || undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      parentId: task.parentId || undefined,
      parentName: task.parentName || undefined,
      tags: task.tags
    }))

    const csvContent = CsvService.exportTasksToCSV(sharedTasks)

    logger.info('CSV export completed via file adapter')
    return csvContent
  }

  /**
   * Import tasks from CSV string using backend-specific types
   */
  static importTasksFromCSV(csvContent: string, userId: string): CsvImportResult<Date> {
    logger.info('Starting CSV import via file adapter', { userId })

    // Parse CSV using shared service with Date parser
    const result = CsvService.importTasksFromCSV<Date>(
      csvContent,
      (dateStr: string) => {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          throw new Error('Invalid due date format')
        }
        return date
      }
    )

    logger.info('CSV import completed via file adapter', {
      userId,
      tasksImported: result.tasks.length,
      errorCount: result.errors.length
    })

    return result
  }
}