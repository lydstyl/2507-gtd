import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks } from '../../domain/entities/Task'

export class GetCompletedTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string, startDate?: string, endDate?: string): Promise<TaskWithSubtasks[]> {
    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    return await this.taskRepository.getCompletedTasks(userId, start, end)
  }
}