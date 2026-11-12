import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { UpdateTaskData, TaskWithSubtasks } from '../../domain/entities/Task'
import { BaseUseCase, SharedUseCaseValidator, AsyncOperationResult, OperationResult, ParentDateSyncService, TaskDateConsistencyService } from '@gtd/shared'

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

      const dataToUpdate = await this.realignDates(id, updateData)
      const updatedTask = await this.taskRepository.update(id, dataToUpdate)

      // Sync parent dates if the task has a parent
      if (updatedTask.parentId) {
        await this.syncParentDates(updatedTask.parentId)
      }

      return updatedTask
    }, 'task update')
  }

  /**
   * A task's deadline (dueDate) can never fall before its planned date.
   * When plannedDate is part of the update, an earlier dueDate is realigned on
   * the new plannedDate (rule demandée par Gabriel : date limite < date prévue
   * → la date limite suit la nouvelle date prévue).
   */
  private async realignDates(id: string, updateData: UpdateTaskData): Promise<UpdateTaskData> {
    if (updateData.plannedDate === undefined) return updateData

    const existing = await this.taskRepository.findById(id)
    if (!existing) return updateData

    const plannedDate = updateData.plannedDate ?? null
    const dueDate = updateData.dueDate !== undefined ? updateData.dueDate : existing.dueDate ?? null
    const alignedDueDate = TaskDateConsistencyService.alignDueDateWithPlannedDate(plannedDate, dueDate)

    if (alignedDueDate === dueDate) return updateData
    return { ...updateData, dueDate: alignedDueDate ?? null }
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
