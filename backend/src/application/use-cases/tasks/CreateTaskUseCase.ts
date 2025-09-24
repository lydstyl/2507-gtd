import { TaskRepository } from '../../../interfaces/repositories/TaskRepository'
import { CreateTaskData, TaskWithSubtasks } from '../../../domain/entities/Task'
import { ValidationError, NotFoundError } from '../../../shared/errors'
import { logger } from '../../../shared/logger'

export class CreateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(data: CreateTaskData): Promise<TaskWithSubtasks> {
    logger.info('Creating task', { userId: data.userId, taskName: data.name })

    try {
      // Business validation
      await this.validateTaskData(data)

      // Apply business rules and defaults
      const taskData = this.applyBusinessRules(data)

      // Create the task
      const task = await this.taskRepository.create(taskData)

      logger.info('Task created successfully', {
        taskId: task.id,
        userId: data.userId,
        taskName: task.name
      })

      return task
    } catch (error) {
      logger.error('Failed to create task', {
        userId: data.userId,
        taskName: data.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }

  private async validateTaskData(data: CreateTaskData): Promise<void> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Task name is required')
    }

    if (data.name.trim().length > 255) {
      throw new ValidationError('Task name must be 255 characters or less')
    }

    if (data.importance !== undefined && (data.importance < 0 || data.importance > 50)) {
      throw new ValidationError('Importance must be between 0 and 50')
    }

    if (data.complexity !== undefined && (data.complexity < 1 || data.complexity > 9)) {
      throw new ValidationError('Complexity must be between 1 and 9')
    }

    if (data.link && data.link.length > 500) {
      throw new ValidationError('Link must be 500 characters or less')
    }

    // Validate parent task exists if parentId is provided
    if (data.parentId) {
      const parentExists = await this.taskRepository.exists(data.parentId)
      if (!parentExists) {
        throw new NotFoundError('Parent task', data.parentId)
      }
    }

    // Validate due date if provided
    if (data.plannedDate) {
      const plannedDate = new Date(data.plannedDate)
      if (isNaN(plannedDate.getTime())) {
        throw new ValidationError('Invalid due date format')
      }
    }
  }

  private applyBusinessRules(data: CreateTaskData): CreateTaskData {
    return {
      ...data,
      name: data.name.trim(),
      importance: data.importance ?? 50,
      complexity: data.complexity ?? 1,
      link: data.link?.trim() || undefined,
      note: data.note?.trim() || undefined,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined
    }
  }
}