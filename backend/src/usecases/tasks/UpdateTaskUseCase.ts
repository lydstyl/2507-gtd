import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { UpdateTaskData, TaskWithSubtasks } from '../../domain/entities/Task'
import { BaseUseCase, SharedUseCaseValidator, AsyncOperationResult, OperationResult, ParentDateSyncService } from '@gtd/shared'

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

      const updatedTask = await this.taskRepository.update(id, updateData)

      // Sync parent dates if the task has a parent
      if (updatedTask.parentId) {
        await this.syncParentDates(updatedTask.parentId)
      }

      // If this task is a parent and its dates changed, update it
      if (updatedTask.subtasks && updatedTask.subtasks.length > 0) {
        const calculatedDates = ParentDateSyncService.calculateParentDates(updatedTask.subtasks)

        // Only update if dates actually need to change
        if (ParentDateSyncService.shouldUpdateParentDates(updatedTask, updatedTask.subtasks)) {
          return await this.taskRepository.update(updatedTask.id, {
            plannedDate: calculatedDates.plannedDate ?? null,
            dueDate: calculatedDates.dueDate ?? null,
          })
        }
      }

      return updatedTask
    }, 'task update')
  }

  /**
   * Sync parent task dates based on its children
   */
  private async syncParentDates(parentId: string): Promise<void> {
    const parent = await this.taskRepository.findById(parentId)
    if (!parent) return

    if (parent.subtasks && parent.subtasks.length > 0) {
      if (ParentDateSyncService.shouldUpdateParentDates(parent, parent.subtasks)) {
        const calculatedDates = ParentDateSyncService.calculateParentDates(parent.subtasks)
        await this.taskRepository.update(parentId, {
          plannedDate: calculatedDates.plannedDate ?? null,
          dueDate: calculatedDates.dueDate ?? null,
        })
      }
    }
  }
}
