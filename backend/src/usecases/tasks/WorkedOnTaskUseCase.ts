import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TaskWithSubtasks } from '../../domain/entities/Task'

export class WorkedOnTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string, userId: string): Promise<TaskWithSubtasks> {
    // Get the original task
    const originalTask = await this.taskRepository.findById(taskId)
    if (!originalTask) {
      throw new Error('Task not found')
    }

    // Verify ownership (security check)
    if (originalTask.userId !== userId) {
      throw new Error('Access denied')
    }

    // Create a new completed task with only the title
    const workedOnTaskData = {
      name: originalTask.name,
      importance: 50, // Default values
      complexity: 1,
      userId: userId,
      isCompleted: true,
      dueDate: undefined,
      parentId: undefined,
      note: undefined,
      link: undefined
    }

    return await this.taskRepository.create(workedOnTaskData)
  }
}