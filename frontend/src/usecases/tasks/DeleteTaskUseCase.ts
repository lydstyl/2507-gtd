import { BaseUseCase } from '../base/UseCase'
import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { OperationResult } from '../../domain/types/Common'

export interface DeleteTaskRequest {
  id: string
  confirmDeletion?: boolean
}

export interface DeleteTaskResponse {
  deletedTaskId: string
  message: string
}

export class DeleteTaskUseCase extends BaseUseCase<DeleteTaskRequest, DeleteTaskResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: DeleteTaskRequest): Promise<OperationResult<DeleteTaskResponse>> {
    return this.handleAsync(async () => {
      // Validate input
      if (!request.id || request.id.trim().length === 0) {
        throw new Error('Task ID is required')
      }

      // Check if task exists
      const task = await this.taskRepository.getById(request.id)
      if (!task) {
        throw new Error('Task not found')
      }

      // Check for subtasks and require confirmation if they exist
      const hasSubtasks = task.subtasks && task.subtasks.length > 0
      if (hasSubtasks && !request.confirmDeletion) {
        throw new Error('Task has subtasks. Deletion requires confirmation.')
      }

      // Perform the deletion
      await this.taskRepository.delete(request.id)

      return {
        deletedTaskId: request.id,
        message: hasSubtasks
          ? 'Task and all its subtasks have been deleted successfully'
          : 'Task has been deleted successfully'
      }
    }, 'Failed to delete task')
  }
}

export interface DeleteAllTasksRequest {
  confirmDeletion: boolean
}

export interface DeleteAllTasksResponse {
  message: string
  deletedCount: number
}

export class DeleteAllTasksUseCase extends BaseUseCase<DeleteAllTasksRequest, DeleteAllTasksResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: DeleteAllTasksRequest): Promise<OperationResult<DeleteAllTasksResponse>> {
    return this.handleAsync(async () => {
      // Require explicit confirmation
      if (!request.confirmDeletion) {
        throw new Error('Deletion of all tasks requires explicit confirmation')
      }

      // Get current task count for response
      const currentTasks = await this.taskRepository.getAll()
      const taskCount = currentTasks.length

      // Perform the deletion
      await this.taskRepository.deleteAll()

      return {
        message: 'All tasks have been deleted successfully',
        deletedCount: taskCount
      }
    }, 'Failed to delete all tasks')
  }
}