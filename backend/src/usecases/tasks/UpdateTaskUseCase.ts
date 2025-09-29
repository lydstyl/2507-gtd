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

  async execute(idOrRequest: string | UpdateTaskRequest, data?: UpdateTaskData): AsyncOperationResult<UpdateTaskResponse> {
    // Support both (id, data) and ({ id, data }) calling conventions
    const id = typeof idOrRequest === 'string' ? idOrRequest : idOrRequest.id
    const updateData = typeof idOrRequest === 'string' ? data! : idOrRequest.data

    // Use shared validation
    const validation = SharedUseCaseValidator.validateUpdateTaskData(updateData)
    if (!validation.success) {
      return validation as OperationResult<UpdateTaskResponse>
    }

    // Check if task exists and update
    return await this.handleAsync(async () => {
      const exists = await this.taskRepository.exists(id)
      if (!exists) {
        throw new Error('Task not found')
      }

      return await this.taskRepository.update(id, updateData)
    }, 'task update')
  }
}
