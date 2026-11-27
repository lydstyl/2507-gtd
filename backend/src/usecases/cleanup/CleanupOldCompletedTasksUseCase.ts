import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { CleanupService } from '../../services/CleanupService'

export interface CleanupResult {
  notesClearedCount: number
  deletedCount: number
  noteCutoffDate: Date
  deleteCutoffDate: Date
}

/**
 * Data retention policy for completed tasks (daily cron, 2 AM UTC):
 * - completed > 1 year ago → note cleared (task kept)
 * - completed > 3 years ago → task deleted entirely (note, subtasks, tags)
 */
export class CleanupOldCompletedTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<CleanupResult> {
    const noteCutoffDate = CleanupService.getNoteCleanupCutoffDate()
    const deleteCutoffDate = CleanupService.getTaskCleanupCutoffDate()

    CleanupService.logCleanupStart()

    try {
      const notesClearedCount = await this.taskRepository.clearOldTaskNotes(noteCutoffDate)
      const deletedCount = await this.taskRepository.deleteOldCompletedTasks(deleteCutoffDate)

      CleanupService.logCleanupResult(notesClearedCount, deletedCount, noteCutoffDate, deleteCutoffDate)

      return {
        notesClearedCount,
        deletedCount,
        noteCutoffDate,
        deleteCutoffDate
      }
    } catch (error) {
      CleanupService.logCleanupError(error as Error)
      throw error
    }
  }
}
