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
      importance: data.importance || 5,
      urgency: data.urgency || 5,
      priority: data.priority || 5
    }

    return await this.taskRepository.create(taskData)
  }

  private validateTaskData(data: CreateTaskData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Task name is required')
    }

    if (data.importance && (data.importance < 1 || data.importance > 9)) {
      throw new Error('Importance must be between 1 and 9')
    }

    if (data.urgency && (data.urgency < 1 || data.urgency > 9)) {
      throw new Error('Urgency must be between 1 and 9')
    }

    if (data.priority && (data.priority < 1 || data.priority > 9)) {
      throw new Error('Priority must be between 1 and 9')
    }
  }
}
