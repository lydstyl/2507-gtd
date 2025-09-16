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

    if (data.importance && (data.importance < 0 || data.importance > 50)) {
      throw new Error('Importance must be between 0 and 50')
    }

    if (data.complexity && (data.complexity < 1 || data.complexity > 9)) {
      throw new Error('Complexity must be between 1 and 9')
    }
  }
}
