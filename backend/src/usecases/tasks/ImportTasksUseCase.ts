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

    // Map to track imported tasks by name -> id (case-insensitive)
    const importedTasks = new Map<string, string>()
    const tasksToProcess = [...tasks]

    // Calculate depth for each task (0 = root, 1 = child, 2 = grandchild, etc.)
    const taskMap = new Map<string, { task: any; depth: number }>()
    const tasksByName = new Map<string, any>()

    // Build quick lookup map (case-insensitive keys)
    for (const task of tasks) {
      const normalizedName = task.name.trim().toLowerCase()
      tasksByName.set(normalizedName, task)
    }

    // Calculate depth for each task by traversing up to root
    for (const task of tasks) {
      let depth = 0
      let currentTask = task
      const visited = new Set<string>()

      // Traverse up the parent chain to calculate depth
      while (currentTask.parentName && !visited.has(currentTask.parentName.toLowerCase())) {
        const normalizedParentName = currentTask.parentName.trim().toLowerCase()
        visited.add(normalizedParentName)
        depth++
        const parentTask = tasksByName.get(normalizedParentName)
        if (!parentTask) {
          // Parent doesn't exist in CSV - this will be handled as an error later
          break
        }
        currentTask = parentTask
      }

      taskMap.set(task.name, { task, depth })
    }

    // Sort by depth (parents with depth 0 first, then children, grandchildren, etc.)
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
          const normalizedParentName = taskData.parentName.trim().toLowerCase()
          const normalizedTaskName = taskData.name.trim().toLowerCase()

          // Vérifier qu'il ne s'agit pas d'une auto-référence
          if (normalizedParentName === normalizedTaskName) {
            console.log(`⚠️ Auto-référence détectée pour "${taskData.name}", parentId ignoré`)
            parentId = undefined
          } else {
            const parentTaskId = importedTasks.get(normalizedParentName)
            if (parentTaskId) {
              parentId = parentTaskId
            } else {
              // Check if parent exists in CSV but wasn't imported yet (shouldn't happen with sorting)
              const parentExistsInCsv = tasksByName.has(normalizedParentName)
              if (parentExistsInCsv) {
                importErrors.push(
                  `Erreur interne: la tâche parente "${taskData.parentName}" existe mais n'a pas été importée pour "${taskData.name}"`
                )
                continue
              } else {
                // Parent task doesn't exist in CSV (likely because it was completed and excluded from export)
                // Import the task as a root task instead of failing
                console.log(`⚠️ Tâche parente "${taskData.parentName}" introuvable pour "${taskData.name}". La tâche sera importée comme tâche racine.`)
                parentId = undefined
              }
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

        // Enregistrer la tâche importée pour les futures références (case-insensitive)
        const normalizedTaskName = taskData.name.trim().toLowerCase()
        importedTasks.set(normalizedTaskName, task.id)
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
