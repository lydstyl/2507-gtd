import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { CreateTaskData, TaskWithSubtasks } from '../../domain/entities/Task'

export class CreateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(data: CreateTaskData): Promise<TaskWithSubtasks> {
    // Validation métier
    this.validateTaskData(data)

    // Logique métier : valeurs par défaut
    const taskData = {
      ...data,
      importance: data.importance || 20,
      complexity: data.complexity || 5,
      isCollection: data.isCollection || false,
      dueDate: data.dueDate,
      userId: data.userId
    }

    return await this.taskRepository.create(taskData)
  }

  private validateTaskData(data: CreateTaskData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Task name is required')
    }

    if (data.importance && (data.importance < 0 || data.importance > 50)) {
      throw new Error('Importance must be between 0 and 50')
    }

    if (data.complexity && (data.complexity < 1 || data.complexity > 9)) {
      throw new Error('Complexity must be between 1 and 9')
    }
  }
}
