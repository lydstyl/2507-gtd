import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { UpdateTaskData, TaskWithSubtasks } from '../../domain/entities/Task'

export class UpdateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(id: string, data: UpdateTaskData): Promise<TaskWithSubtasks> {
    // Validation métier
    this.validateUpdateData(data)

    // Vérifier que la tâche existe
    const exists = await this.taskRepository.exists(id)
    if (!exists) {
      throw new Error('Task not found')
    }

    return await this.taskRepository.update(id, data)
  }

  private validateUpdateData(data: UpdateTaskData): void {
    if (
      data.name !== undefined &&
      (!data.name || data.name.trim().length === 0)
    ) {
      throw new Error('Task name cannot be empty')
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
