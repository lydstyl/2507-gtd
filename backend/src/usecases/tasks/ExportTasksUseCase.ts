import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { CSVService, TaskWithTags } from '../../services/csvService'

export class ExportTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string): Promise<string> {
    // Récupérer toutes les tâches de l'utilisateur avec leurs tags
    const allTasks = await this.taskRepository.getAllTasksWithTags(userId)

    // Filtrer les tâches non terminées (exclure les tâches complétées)
    const activeTasks = allTasks.filter(task => !task.isCompleted)

    // Exporter en CSV
    const csvContent = CSVService.exportTasksToCSV(activeTasks)

    return csvContent
  }
}
