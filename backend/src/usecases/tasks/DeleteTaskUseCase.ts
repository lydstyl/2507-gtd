import { TaskRepository } from '../../interfaces/repositories/TaskRepository'

export class DeleteTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await this.taskRepository.findById(id)
    if (!task || task.userId !== userId) {
      throw new Error('Task not found or access denied')
    }

    await this.taskRepository.delete(id)
  }
}
