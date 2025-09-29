import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { UpdateTaskData, TaskWithSubtasks } from '../../domain/entities/Task'
import { BaseUseCase, SharedUseCaseValidator, AsyncOperationResult, OperationResult } from '@gtd/shared'

export interface UpdateTaskRequest {
  id: string
  data: UpdateTaskData
}

export interface UpdateTaskResponse extends TaskWithSubtasks {}

export class UpdateTaskUseCase extends BaseUseCase<UpdateTaskRequest, UpdateTaskResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: UpdateTaskRequest): AsyncOperationResult<UpdateTaskResponse> {
    const { id, data } = request

    // Use shared validation
    const validation = SharedUseCaseValidator.validateUpdateTaskData(data)
    if (!validation.success) {
      return validation as OperationResult<UpdateTaskResponse>
    }

    // Check if task exists and update
    return await this.handleAsync(async () => {
      const exists = await this.taskRepository.exists(id)
      if (!exists) {
        throw new Error('Task not found')
      }

      return await this.taskRepository.update(id, data)
    }, 'task update')
  }
}
