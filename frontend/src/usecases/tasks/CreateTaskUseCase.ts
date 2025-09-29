import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskEntity, CreateTaskData } from '../../domain/entities/Task'
import { TaskPriorityService, SharedUseCaseValidator, TASK_CONSTANTS } from '@gtd/shared'
import { OperationResult } from '../../domain/types/Common'

export interface CreateTaskRequest extends CreateTaskData {
  // Additional business logic parameters
  autoCalculatePoints?: boolean
}

export interface CreateTaskResponse {
  task: TaskEntity
}

export class CreateTaskUseCase extends BaseUseCase<CreateTaskRequest, CreateTaskResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: CreateTaskRequest): Promise<OperationResult<CreateTaskResponse>> {
    return this.handleAsync(async () => {
      // Use shared validation
      const validation = SharedUseCaseValidator.validateCreateTaskData(request)
      if (!validation.success) {
        throw new Error(validation.error?.message || 'Validation failed')
      }

      // Apply frontend-specific business rules and defaults
      const taskData = this.applyBusinessRules(request)

      // Perform additional frontend-specific validation
      const frontendValidation = this.validateFrontendSpecificRules(request)
      if (!frontendValidation.isValid) {
        throw new Error(frontendValidation.errors.join(', '))
      }

      // Create the task
      const createdTask = await this.taskRepository.create(taskData)
      const taskEntity = new TaskEntity(createdTask)

      return {
        task: taskEntity
      }
    }, 'Failed to create task')
  }

  private validateFrontendSpecificRules(request: CreateTaskRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate note length (frontend-specific business rule)
    if (request.note && request.note.length > TASK_CONSTANTS.taskNoteMaxLength) {
      errors.push(`Note cannot exceed ${TASK_CONSTANTS.taskNoteMaxLength} characters`)
    }

    // Validate planned date format (frontend-specific validation)
    if (request.plannedDate) {
      const date = new Date(request.plannedDate)
      if (isNaN(date.getTime())) {
        errors.push('Invalid planned date format')
      }
    }

    // Validate link format if provided (frontend-specific validation)
    if (request.link && request.link.length > TASK_CONSTANTS.taskLinkMaxLength) {
      errors.push(`Link cannot exceed ${TASK_CONSTANTS.taskLinkMaxLength} characters`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private applyBusinessRules(request: CreateTaskRequest): CreateTaskData {
    const taskData: CreateTaskData = {
      name: request.name.trim(),
      link: request.link?.trim(),
      note: request.note?.trim(),
      importance: request.importance ?? 0, // Default to minimal importance for new tasks
      complexity: request.complexity ?? 3, // Default to medium complexity
      plannedDate: request.plannedDate,
      parentId: request.parentId,
      tagIds: request.tagIds,
      isCompleted: request.isCompleted ?? false
    }

    // Auto-calculate points if requested (default behavior)
    if (request.autoCalculatePoints !== false) {
      // The points will be calculated on the backend, but we can validate here
      const calculatedPoints = TaskPriorityService.calculatePoints(
        taskData.importance!,
        taskData.complexity!
      )

      if (calculatedPoints > TASK_CONSTANTS.maxPoints) {
        // Adjust complexity to stay within limits
        taskData.complexity = Math.max(1, Math.ceil(10 * taskData.importance! / TASK_CONSTANTS.maxPoints))
      }
    }

    return taskData
  }
}