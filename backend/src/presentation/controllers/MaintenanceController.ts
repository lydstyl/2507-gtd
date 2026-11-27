import { Request, Response } from 'express'
import { Container } from '../../infrastructure/container'
import { CleanupOldCompletedTasksUseCase } from '../../usecases/cleanup/CleanupOldCompletedTasksUseCase'

/**
 * Maintenance endpoints (manual triggers for the daily cleanup cron).
 */
export class MaintenanceController {
  /**
   * POST /api/maintenance/cleanup
   * Runs the data retention policy now:
   * - notes of completed tasks > 1 year old are cleared
   * - completed tasks > 3 years old are deleted entirely
   */
  runCleanup = async (_req: Request, res: Response): Promise<void> => {
    try {
      const container = Container.getInstance()
      const taskRepository = container.getTaskRepository()
      const cleanupUseCase = new CleanupOldCompletedTasksUseCase(taskRepository)
      const result = await cleanupUseCase.execute()

      res.json({
        notesCleared: result.notesClearedCount,
        tasksDeleted: result.deletedCount,
        noteCutoffDate: result.noteCutoffDate.toISOString(),
        deleteCutoffDate: result.deleteCutoffDate.toISOString()
      })
    } catch (error) {
      console.error('Maintenance cleanup failed:', error)
      res.status(500).json({ error: 'Cleanup failed' })
    }
  }
}
