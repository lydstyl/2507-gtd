import { TaskRepository } from '../../../interfaces/repositories/TaskRepository'
import { NotFoundError, ForbiddenError } from '../../../shared/errors'
import { logger } from '../../../shared/logger'

export class DeleteTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, userId: string): Promise<void> {
    logger.info('Deleting task', { taskId, userId })

    try {
      // Check if task exists and belongs to user
      const existingTask = await this.taskRepository.findById(taskId)
      if (!existingTask) {
        throw new NotFoundError('Task', taskId)
      }

      if (existingTask.userId !== userId) {
        throw new ForbiddenError('You do not have permission to delete this task')
      }

      // Delete the task (this will cascade to subtasks due to database constraints)
      await this.taskRepository.delete(taskId)

      logger.info('Task deleted successfully', {
        taskId,
        userId,
        taskName: existingTask.name,
        hadSubtasks: existingTask.subtasks.length > 0
      })
    } catch (error) {
      logger.error('Failed to delete task', {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    logger.info('Deleting all tasks for user', { userId })

    try {
      await this.taskRepository.deleteAllByUserId(userId)

      logger.info('All tasks deleted successfully for user', { userId })
    } catch (error) {
      logger.error('Failed to delete all tasks for user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }
}