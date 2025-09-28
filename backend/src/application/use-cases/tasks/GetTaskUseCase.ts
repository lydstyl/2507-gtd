import { TaskRepository } from '../../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks } from '../../../domain/entities/Task'
import { NotFoundError, ForbiddenError } from '@gtd/shared'
import { logger } from '../../../shared/logger'

export class GetTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, userId: string): Promise<TaskWithSubtasks> {
    logger.debug('Retrieving task', { taskId, userId })

    try {
      const task = await this.taskRepository.findById(taskId)

      if (!task) {
        throw new NotFoundError('Task', taskId)
      }

      if (task.userId !== userId) {
        throw new ForbiddenError('You do not have permission to view this task')
      }

      logger.debug('Task retrieved successfully', {
        taskId,
        userId,
        taskName: task.name
      })

      return task
    } catch (error) {
      logger.error('Failed to retrieve task', {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }
}