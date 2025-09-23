import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskEntity } from '../../domain/entities/Task'
import { OperationResult } from '../../domain/types/Common'

export interface GetTaskByIdRequest {
  id: string
}

export interface GetTaskByIdResponse {
  task: TaskEntity
}

export class GetTaskByIdUseCase extends BaseUseCase<GetTaskByIdRequest, GetTaskByIdResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: GetTaskByIdRequest): Promise<OperationResult<GetTaskByIdResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      if (!request.id || request.id.trim().length === 0) {
        throw new Error('Task ID is required')
      }

      // Fetch the task
      const task = await this.taskRepository.getById(request.id)
      if (!task) {
        throw new Error('Task not found')
      }

      // Convert to TaskEntity
      const taskEntity = new TaskEntity(task)

      return {
        task: taskEntity
      }
    }, 'Failed to fetch task')
  }
}