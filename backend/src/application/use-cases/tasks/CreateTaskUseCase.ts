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

    if (data.importance !== undefined && (data.importance < 1 || data.importance > 9)) {
      throw new ValidationError('Importance must be between 1 and 9')
    }

    if (data.urgency !== undefined && (data.urgency < 1 || data.urgency > 9)) {
      throw new ValidationError('Urgency must be between 1 and 9')
    }

    if (data.priority !== undefined && (data.priority < 1 || data.priority > 9)) {
      throw new ValidationError('Priority must be between 1 and 9')
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
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate)
      if (isNaN(dueDate.getTime())) {
        throw new ValidationError('Invalid due date format')
      }
    }
  }

  private applyBusinessRules(data: CreateTaskData): CreateTaskData {
    return {
      ...data,
      name: data.name.trim(),
      importance: data.importance ?? 5,
      urgency: data.urgency ?? 5,
      priority: data.priority ?? 5,
      link: data.link?.trim() || undefined,
      note: data.note?.trim() || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined
    }
  }
}