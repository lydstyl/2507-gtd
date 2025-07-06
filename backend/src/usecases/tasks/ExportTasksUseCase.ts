import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { CSVService, TaskWithTags } from '../../services/csvService'

export class ExportTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string): Promise<string> {
    // Récupérer toutes les tâches de l'utilisateur avec leurs tags
    const tasks = await this.taskRepository.getAllTasksWithTags(userId)

    // Exporter en CSV
    const csvContent = CSVService.exportTasksToCSV(tasks)

    return csvContent
  }
}
