import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks } from '../../domain/entities/Task'

export class MarkTaskAsCompletedUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, userId: string): Promise<TaskWithSubtasks> {
    // Check if task exists and belongs to user
    const existingTask = await this.taskRepository.findById(taskId)
    if (!existingTask) {
      throw new Error(`Task with id ${taskId} not found`)
    }

    if (existingTask.userId !== userId) {
      throw new Error('Access denied: task does not belong to user')
    }

    if (existingTask.isCompleted) {
      throw new Error('Task is already completed')
    }

    // Mark task as completed
    return await this.taskRepository.markAsCompleted(taskId, userId)
  }
}