import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { CreateTaskData, TaskWithSubtasks } from '../../domain/entities/Task'
import { BaseUseCase, SharedUseCaseValidator, OperationResult, AsyncOperationResult } from '@gtd/shared'

export interface CreateTaskRequest extends CreateTaskData {}
export interface CreateTaskResponse extends TaskWithSubtasks {}

export class CreateTaskUseCase extends BaseUseCase<CreateTaskRequest, CreateTaskResponse> {
  constructor(private taskRepository: TaskRepository) {
    super()
  }

  async execute(request: CreateTaskRequest): AsyncOperationResult<CreateTaskResponse> {
    // Use shared validation
    const validation = SharedUseCaseValidator.validateCreateTaskData(request)
    if (!validation.success) {
      return validation as OperationResult<CreateTaskResponse>
    }

    // Calculate default dueDate if not provided (6 months from now)
    let dueDate = request.dueDate
    if (!dueDate) {
      const sixMonthsFromNow = new Date()
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
      dueDate = sixMonthsFromNow
    }

    // Apply business logic defaults
    const taskData = {
      ...request,
      importance: request.importance || 0,
      complexity: request.complexity || 3,
      plannedDate: request.plannedDate,
      dueDate: dueDate,
      userId: request.userId
    }

    // Execute with error handling
    return await this.handleAsync(
      () => this.taskRepository.create(taskData),
      'task creation'
    )
  }
}
