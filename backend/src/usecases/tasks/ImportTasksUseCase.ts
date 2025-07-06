import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { CSVService } from '../../services/csvService'

export class ImportTasksUseCase {
  constructor(
    private taskRepository: TaskRepository,
    private tagRepository: TagRepository
  ) {}

  async execute(
    userId: string,
    csvContent: string
  ): Promise<{
    importedCount: number
    errors: string[]
  }> {
    // Parser le CSV
    const { tasks, errors } = CSVService.importTasksFromCSV(csvContent, userId)

    if (errors.length > 0) {
      return { importedCount: 0, errors }
    }

    let importedCount = 0
    const importErrors: string[] = []

    // Importer chaque tâche
    for (const taskData of tasks) {
      try {
        // Créer ou récupérer les tags
        const tagIds: string[] = []
        for (const tagName of taskData.tagNames) {
          let tag = await this.tagRepository.findByNameAndUser(tagName, userId)
          if (!tag) {
            tag = await this.tagRepository.create({
              name: tagName,
              userId
            })
          }
          tagIds.push(tag.id)
        }

        // Créer la tâche
        const { tagNames, ...taskDataSansTagNames } = taskData
        const task = await this.taskRepository.create({
          ...taskDataSansTagNames,
          userId,
          tagIds
        })

        importedCount++
      } catch (error) {
        importErrors.push(
          `Erreur lors de l'import de "${taskData.name}": ${error}`
        )
      }
    }

    return {
      importedCount,
      errors: importErrors
    }
  }
}
