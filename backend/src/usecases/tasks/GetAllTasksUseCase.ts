import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks, TaskFilters } from '../../domain/entities/Task'

export class GetAllTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(
    userId: string,
    filters?: TaskFilters
  ): Promise<TaskWithSubtasks[]> {
    return await this.taskRepository.findAll({ ...filters, userId })
  }

  async executeRootTasks(
    userId: string,
    filters?: TaskFilters
  ): Promise<TaskWithSubtasks[]> {
    return await this.taskRepository.findAllRootTasks({ ...filters, userId })
  }
}
