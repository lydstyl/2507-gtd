import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskEntity, UpdateTaskData } from '../../domain/entities/Task'
import { TaskPriorityService } from '../../domain/services/TaskPriorityService'
import { TASK_CONSTANTS } from '../../domain/types/BusinessConstants'
import { OperationResult } from '../../domain/types/Common'

export interface UpdateTaskRequest {
  id: string
  data: UpdateTaskData
  autoCalculatePoints?: boolean
}

export interface UpdateTaskResponse {
  task: TaskEntity
}

export class UpdateTaskUseCase extends BaseUseCase<UpdateTaskRequest, UpdateTaskResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: UpdateTaskRequest): Promise<OperationResult<UpdateTaskResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      const validation = this.validateUpdateTaskRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Get current task to validate existence
      const currentTask = await this.taskRepository.getById(request.id)
      if (!currentTask) {
        throw new Error('Task not found')
      }

      // Apply business rules
      const updateData = this.applyBusinessRules(request.data, currentTask)

      // Update the task
      const updatedTask = await this.taskRepository.update(request.id, updateData)
      const taskEntity = new TaskEntity(updatedTask)

      return {
        task: taskEntity
      }
    }, 'Failed to update task')
  }

  private validateUpdateTaskRequest(request: UpdateTaskRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate ID
    if (!request.id || request.id.trim().length === 0) {
      errors.push('Task ID is required')
    }

    // Validate name if provided
    if (request.data.name !== undefined) {
      if (!request.data.name || request.data.name.trim().length === 0) {
        errors.push('Task name cannot be empty')
      } else if (request.data.name.length > TASK_CONSTANTS.taskNameMaxLength) {
        errors.push(`Task name cannot exceed ${TASK_CONSTANTS.taskNameMaxLength} characters`)
      }
    }

    // Validate importance if provided
    if (request.data.importance !== undefined) {
      if (request.data.importance < 0 || request.data.importance > TASK_CONSTANTS.maxImportance) {
        errors.push(`Importance must be between 0 and ${TASK_CONSTANTS.maxImportance}`)
      }
    }

    // Validate complexity if provided
    if (request.data.complexity !== undefined) {
      if (request.data.complexity < 1 || request.data.complexity > TASK_CONSTANTS.maxComplexity) {
        errors.push(`Complexity must be between 1 and ${TASK_CONSTANTS.maxComplexity}`)
      }
    }

    // Validate note length if provided
    if (request.data.note !== undefined && request.data.note !== null) {
      if (request.data.note.length > TASK_CONSTANTS.taskNoteMaxLength) {
        errors.push(`Note cannot exceed ${TASK_CONSTANTS.taskNoteMaxLength} characters`)
      }
    }

    // Validate tag count if provided
    if (request.data.tagIds && request.data.tagIds.length > TASK_CONSTANTS.maxTagsPerTask) {
      errors.push(`Cannot assign more than ${TASK_CONSTANTS.maxTagsPerTask} tags to a task`)
    }

    // Validate due date if provided
    if (request.data.plannedDate !== undefined && request.data.plannedDate !== null) {
      const date = new Date(request.data.plannedDate)
      if (isNaN(date.getTime())) {
        errors.push('Invalid due date format')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private applyBusinessRules(updateData: UpdateTaskData, currentTask: any): UpdateTaskData {
    const processedData: UpdateTaskData = { ...updateData }

    // Trim string fields
    if (processedData.name !== undefined) {
      processedData.name = processedData.name.trim()
    }

    if (processedData.link !== undefined) {
      processedData.link = processedData.link?.trim()
    }

    if (processedData.note !== undefined && processedData.note !== null) {
      processedData.note = processedData.note.trim()
    }

    // Handle completion logic
    if (processedData.isCompleted !== undefined) {
      if (processedData.isCompleted && !currentTask.isCompleted) {
        // Task is being marked as completed
        processedData.completedAt = new Date().toISOString()
      } else if (!processedData.isCompleted && currentTask.isCompleted) {
        // Task is being marked as incomplete
        processedData.completedAt = null
      }
    }

    // Recalculate points if importance or complexity changed
    if (processedData.importance !== undefined || processedData.complexity !== undefined) {
      const newImportance = processedData.importance ?? currentTask.importance
      const newComplexity = processedData.complexity ?? currentTask.complexity

      const calculatedPoints = TaskPriorityService.calculatePoints(newImportance, newComplexity)

      if (calculatedPoints > TASK_CONSTANTS.maxPoints) {
        // Adjust complexity to stay within limits
        const adjustedComplexity = Math.max(1, Math.ceil(10 * newImportance / TASK_CONSTANTS.maxPoints))
        if (processedData.complexity !== undefined) {
          processedData.complexity = adjustedComplexity
        }
      }
    }

    return processedData
  }
}