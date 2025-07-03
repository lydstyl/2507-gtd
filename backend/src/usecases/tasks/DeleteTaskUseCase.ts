import { TaskRepository } from '../../interfaces/repositories/TaskRepository'

export class DeleteTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(id: string): Promise<void> {
    // Vérifier que la tâche existe
    const exists = await this.taskRepository.exists(id)
    if (!exists) {
      throw new Error('Task not found')
    }

    await this.taskRepository.delete(id)
  }
}
