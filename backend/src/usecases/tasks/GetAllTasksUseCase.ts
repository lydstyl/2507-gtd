import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks, TaskFilters } from '../../domain/entities/Task'
import { QueryOptions } from '@gtd/shared'

export class GetAllTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(
    userId: string,
    filters?: TaskFilters,
    options?: QueryOptions
  ): Promise<TaskWithSubtasks[]> {
    return await this.taskRepository.findAll({ ...filters, userId }, options)
  }

  async executeRootTasks(
    userId: string,
    filters?: TaskFilters,
    options?: QueryOptions
  ): Promise<TaskWithSubtasks[]> {
    return await this.taskRepository.findAllRootTasks({ ...filters, userId }, options)
  }
}
