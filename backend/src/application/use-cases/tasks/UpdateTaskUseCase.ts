import { TaskRepository } from '../../../interfaces/repositories/TaskRepository'
import { UpdateTaskData, TaskWithSubtasks } from '../../../domain/entities/Task'
import { ValidationError, NotFoundError, ForbiddenError } from '@gtd/shared'
import { logger } from '../../../shared/logger'
import { TASK_CONSTANTS } from '@gtd/shared'

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

    if (data.importance !== undefined && (data.importance < 0 || data.importance > TASK_CONSTANTS.maxImportance)) {
      throw new ValidationError(`Importance must be between 0 and ${TASK_CONSTANTS.maxImportance}`)
    }

    if (data.complexity !== undefined && (data.complexity < 1 || data.complexity > TASK_CONSTANTS.maxComplexity)) {
      throw new ValidationError(`Complexity must be between 1 and ${TASK_CONSTANTS.maxComplexity}`)
    }

    if (data.link !== undefined && data.link && data.link.length > TASK_CONSTANTS.taskLinkMaxLength) {
      throw new ValidationError(`Link must be ${TASK_CONSTANTS.taskLinkMaxLength} characters or less`)
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
    if (data.plannedDate !== undefined && data.plannedDate !== null) {
      const plannedDate = new Date(data.plannedDate)
      if (isNaN(plannedDate.getTime())) {
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

    if (data.plannedDate !== undefined && data.plannedDate !== null) {
      processedData.plannedDate = new Date(data.plannedDate)
    }

    return processedData
  }
}