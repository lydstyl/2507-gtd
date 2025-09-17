import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { CleanupService } from '../../services/CleanupService'

export class CleanupOldCompletedTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<{ deletedCount: number; cutoffDate: Date }> {
    const cutoffDate = CleanupService.getCleanupCutoffDate()

    CleanupService.logCleanupStart()

    try {
      const deletedCount = await this.taskRepository.deleteOldCompletedTasks(cutoffDate)

      CleanupService.logCleanupResult(deletedCount, cutoffDate)

      return {
        deletedCount,
        cutoffDate
      }
    } catch (error) {
      CleanupService.logCleanupError(error as Error)
      throw error
    }
  }
}