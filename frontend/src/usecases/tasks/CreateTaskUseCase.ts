import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskEntity, CreateTaskData } from '../../domain/entities/Task'
import { TaskPriorityService } from '../../domain/services/TaskPriorityService'
import { TASK_CONSTANTS } from '../../domain/types/BusinessConstants'
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
      // Validate input
      const validation = this.validateCreateTaskRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Apply business rules and defaults
      const taskData = this.applyBusinessRules(request)

      // Create the task
      const createdTask = await this.taskRepository.create(taskData)
      const taskEntity = new TaskEntity(createdTask)

      return {
        task: taskEntity
      }
    }, 'Failed to create task')
  }

  private validateCreateTaskRequest(request: CreateTaskRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate required fields
    if (!request.name || request.name.trim().length === 0) {
      errors.push('Task name is required')
    }

    if (request.name && request.name.length > TASK_CONSTANTS.taskNameMaxLength) {
      errors.push(`Task name cannot exceed ${TASK_CONSTANTS.taskNameMaxLength} characters`)
    }

    // Validate importance
    if (request.importance !== undefined) {
      if (request.importance < 0 || request.importance > TASK_CONSTANTS.maxImportance) {
        errors.push(`Importance must be between 0 and ${TASK_CONSTANTS.maxImportance}`)
      }
    }

    // Validate complexity
    if (request.complexity !== undefined) {
      if (request.complexity < 1 || request.complexity > TASK_CONSTANTS.maxComplexity) {
        errors.push(`Complexity must be between 1 and ${TASK_CONSTANTS.maxComplexity}`)
      }
    }

    // Validate note length
    if (request.note && request.note.length > TASK_CONSTANTS.taskNoteMaxLength) {
      errors.push(`Note cannot exceed ${TASK_CONSTANTS.taskNoteMaxLength} characters`)
    }

    // Validate tag count
    if (request.tagIds && request.tagIds.length > TASK_CONSTANTS.maxTagsPerTask) {
      errors.push(`Cannot assign more than ${TASK_CONSTANTS.maxTagsPerTask} tags to a task`)
    }

    // Validate due date
    if (request.dueDate) {
      const date = new Date(request.dueDate)
      if (isNaN(date.getTime())) {
        errors.push('Invalid due date format')
      }
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
      dueDate: request.dueDate,
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