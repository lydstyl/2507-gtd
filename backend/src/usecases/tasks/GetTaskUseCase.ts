import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks } from '../../domain/entities/Task'

export class GetTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(id: string, userId: string): Promise<TaskWithSubtasks> {
    const task = await this.taskRepository.findById(id)

    if (!task || task.userId !== userId) {
      throw new Error('Task not found or access denied')
    }

    return task
  }
}
