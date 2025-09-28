import { TaskRepository } from '../../interfaces/repositories/TaskRepository'
import { TagRepository } from '../../interfaces/repositories/TagRepository'
import { CsvService } from '../../application/services/CsvService'

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
    const { tasks, errors } = CsvService.importTasksFromCSV(csvContent, userId)

    if (errors.length > 0) {
      return { importedCount: 0, errors }
    }

    let importedCount = 0
    const importErrors: string[] = []

    // Première passe : importer toutes les tâches sans parentId
    const importedTasks = new Map<string, string>() // nom -> id
    const tasksToProcess = [...tasks]

    // Trier les tâches par niveau de profondeur pour gérer les structures imbriquées
    // Créer un map des tâches par nom pour calculer la profondeur
    const taskMap = new Map<string, { task: any; depth: number }>()
    
    // Première passe : calculer la profondeur de chaque tâche
    for (const task of tasks) {
      let depth = 0
      let currentTask = task
      const visited = new Set<string>()
      
      while (currentTask.parentName && !visited.has(currentTask.parentName)) {
        visited.add(currentTask.parentName)
        depth++
        const foundTask = tasks.find(t => t.name === currentTask.parentName)
        if (!foundTask) break
        currentTask = foundTask
      }
      
      taskMap.set(task.name, { task, depth })
    }
    
    // Trier par profondeur (les parents d'abord)
    tasksToProcess.sort((a, b) => {
      const depthA = taskMap.get(a.name)?.depth || 0
      const depthB = taskMap.get(b.name)?.depth || 0
      return depthA - depthB
    })

    // Importer chaque tâche
    for (const taskData of tasksToProcess) {
      try {
        // Créer ou récupérer les tags
        const tagIds: string[] = []
        for (let i = 0; i < taskData.tagNames.length; i++) {
          const tagName = taskData.tagNames[i]
          const tagColor = taskData.tagColors?.[i] // Get corresponding color if available

          let tag = await this.tagRepository.findByNameAndUser(tagName, userId)
          if (!tag) {
            tag = await this.tagRepository.create({
              name: tagName,
              color: tagColor || undefined, // Use color from CSV or undefined
              userId
            })
          } else if (tagColor && tag.color !== tagColor) {
            // Update existing tag color if different
            await this.tagRepository.update(tag.id, { color: tagColor })
          }
          tagIds.push(tag.id)
        }

        // Déterminer le parentId si c'est une sous-tâche
        let parentId: string | undefined
        if (taskData.parentName) {
          // Vérifier qu'il ne s'agit pas d'une auto-référence
          if (taskData.parentName === taskData.name) {
            console.log(`⚠️ Auto-référence détectée pour "${taskData.name}", parentId ignoré`)
            parentId = undefined
          } else {
            const parentTaskId = importedTasks.get(taskData.parentName)
            if (parentTaskId) {
              parentId = parentTaskId
            } else {
              importErrors.push(
                `Impossible de trouver la tâche parente "${taskData.parentName}" pour "${taskData.name}"`
              )
              continue
            }
          }
        }

        // Créer la tâche
        const { tagNames, tagColors, parentName, ...taskDataSansTagNames } = taskData
        const task = await this.taskRepository.create({
          ...taskDataSansTagNames,
          userId,
          parentId,
          tagIds
        })

        // Enregistrer la tâche importée pour les futures références
        importedTasks.set(taskData.name, task.id)
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
