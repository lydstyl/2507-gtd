import { TaskRepository, CompletionStats } from '../../interfaces/repositories/TaskRepository'

export class GetCompletionStatsUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string): Promise<CompletionStats> {
    return await this.taskRepository.getCompletionStats(userId)
  }
}