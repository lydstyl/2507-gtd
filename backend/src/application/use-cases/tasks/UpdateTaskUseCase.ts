import { TaskRepository } from '../../../interfaces/repositories/TaskRepository'
import { UpdateTaskData, TaskWithSubtasks } from '../../../domain/entities/Task'
import { ValidationError, NotFoundError, ForbiddenError } from '../../../shared/errors'
import { logger } from '../../../shared/logger'

export class UpdateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, data: UpdateTaskData, userId: string): Promise<TaskWithSubtasks> {
    logger.info('Updating task', { taskId, userId })

    try {
      // Check if task exists and belongs to user
      const existingTask = await this.taskRepository.findById(taskId)
      if (!existingTask) {
        throw new NotFoundError('Task', taskId)
      }

      if (existingTask.userId !== userId) {
        throw new ForbiddenError('You do not have permission to update this task')
      }

      // Business validation
      await this.validateUpdateData(data, taskId, userId)

      // Apply business rules
      const updateData = this.applyBusinessRules(data)

      // Update the task
      const updatedTask = await this.taskRepository.update(taskId, updateData)

      logger.info('Task updated successfully', {
        taskId,
        userId,
        updatedFields: Object.keys(data)
      })

      return updatedTask
    } catch (error) {
      logger.error('Failed to update task', {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined)

      throw error
    }
  }

  private async validateUpdateData(data: UpdateTaskData, taskId: string, userId: string): Promise<void> {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Task name cannot be empty')
      }

      if (data.name.trim().length > 255) {
        throw new ValidationError('Task name must be 255 characters or less')
      }
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

    if (data.link !== undefined && data.link && data.link.length > 500) {
      throw new ValidationError('Link must be 500 characters or less')
    }

    // Validate parent task exists and prevent circular references
    if (data.parentId !== undefined) {
      if (data.parentId === taskId) {
        throw new ValidationError('Task cannot be its own parent')
      }

      if (data.parentId) {
        const parentExists = await this.taskRepository.exists(data.parentId)
        if (!parentExists) {
          throw new NotFoundError('Parent task', data.parentId)
        }

        // Additional check to prevent circular references would go here
        // This would require checking if the parent (or any of its parents) is a child of the current task
      }
    }

    // Validate due date if provided
    if (data.dueDate !== undefined && data.dueDate !== null) {
      const dueDate = new Date(data.dueDate)
      if (isNaN(dueDate.getTime())) {
        throw new ValidationError('Invalid due date format')
      }
    }
  }

  private applyBusinessRules(data: UpdateTaskData): UpdateTaskData {
    const processedData: UpdateTaskData = { ...data }

    if (data.name !== undefined) {
      processedData.name = data.name.trim()
    }

    if (data.link !== undefined) {
      processedData.link = data.link?.trim() || undefined
    }

    if (data.note !== undefined) {
      processedData.note = data.note?.trim() || undefined
    }

    if (data.dueDate !== undefined && data.dueDate !== null) {
      processedData.dueDate = new Date(data.dueDate)
    }

    return processedData
  }
}