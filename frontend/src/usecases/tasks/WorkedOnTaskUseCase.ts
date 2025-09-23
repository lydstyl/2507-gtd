import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskEntity } from '../../domain/entities/Task'
import { OperationResult } from '../../domain/types/Common'

export interface WorkedOnTaskRequest {
  taskId: string
}

export interface WorkedOnTaskResponse {
  completedTask: TaskEntity
}

export class WorkedOnTaskUseCase extends BaseUseCase<WorkedOnTaskRequest, WorkedOnTaskResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: WorkedOnTaskRequest): Promise<OperationResult<WorkedOnTaskResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      if (!request.taskId || request.taskId.trim().length === 0) {
        throw new Error('Task ID is required')
      }

      // Create completed copy of the task
      const completedTask = await this.taskRepository.workedOnTask(request.taskId)
      const taskEntity = new TaskEntity(completedTask)

      return {
        completedTask: taskEntity
      }
    }, 'Failed to create worked on task')
  }
}