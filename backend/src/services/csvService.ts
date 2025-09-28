import { Task, TaskTag } from '../domain/entities/Task'
import { Tag } from '../domain/entities/Tag'
import { TASK_CONSTANTS } from '@gtd/shared'

export interface TaskWithTags extends Omit<Task, 'note'> {
  tags: (TaskTag & { tag: Tag })[]
  parentName?: string // Nom de la tâche parente pour l'import/export
  note: string | null
}

export class CSVService {
  /**
   * Exporte les tâches d'un utilisateur en format CSV
   */
  static exportTasksToCSV(tasks: TaskWithTags[]): string {
    const headers = [
      'ID',
      'Nom',
      'Lien',
      'Note',
      'Importance',
      'Complexité',
      'Points',
      'Date prévue',
      'Date limite',
      'Date de création',
      'Date de modification',
      'Tâche parente',
      'Nom tâche parente',
      'Tags',
      'Couleurs tags'
    ]

    const rows = tasks.map((task) => [
      task.id,
      `"${task.name.replace(/"/g, '""')}"`, // Échapper les guillemets
      task.link ? `"${task.link.replace(/"/g, '""')}"` : '',
      task.note ? `"${task.note.replace(/"/g, '""')}"` : '',
       task.importance,
       task.complexity,
       task.points,
       task.plannedDate ? task.plannedDate.toISOString().split('T')[0] : '',
       task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
       task.createdAt.toISOString().split('T')[0],
      task.updatedAt.toISOString().split('T')[0],
      task.parentId || '',
      task.parentName || '',
      task.tags.map((t) => t.tag.name).join(';'),
      task.tags.map((t) => t.tag.color || '').join(';')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n')
    return csvContent
  }

  /**
   * Importe des tâches depuis un fichier CSV
   */
  static importTasksFromCSV(
    csvContent: string,
    userId: string
  ): {
      tasks: Array<{
        name: string
        link?: string
        note?: string
        importance: number
        complexity: number
        points: number
        plannedDate?: Date
        dueDate?: Date
        parentName?: string
        tagNames: string[]
        tagColors: (string | null)[]
      }>
    errors: string[]
  } {
    const lines = csvContent.split('\n').filter((line) => line.trim())
    const errors: string[] = []
    const tasks: Array<{
        name: string
        link?: string
        note?: string
        importance: number
        complexity: number
        points: number
        plannedDate?: Date
        dueDate?: Date
        parentName?: string
        tagNames: string[]
        tagColors: (string | null)[]
      }> = []

    // Ignorer l'en-tête
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const columns = this.parseCSVLine(line)

      if (columns.length < 15) {
        errors.push(
          `Ligne ${i + 1}: Nombre de colonnes insuffisant (${
            columns.length
          } au lieu de 15)`
        )
        continue
      }

      try {
        const [
          id, // Ignoré lors de l'import
          name,
          link,
          note,
          importanceStr,
          complexityStr,
          pointsStr,
          plannedDateStr,
          dueDateStr,
          createdAtStr, // Ignoré lors de l'import
          updatedAtStr, // Ignoré lors de l'import
          parentId, // Ignoré lors de l'import
          parentName,
          tagNamesStr,
          tagColorsStr
        ] = columns

        // Validation des données
        if (!name || name.trim() === '') {
          errors.push(`Ligne ${i + 1}: Le nom de la tâche est requis`)
          continue
        }

        const importance = parseInt(importanceStr)
        const complexity = parseInt(complexityStr)
        const points = parseInt(pointsStr)

        if (isNaN(importance) || importance < 0 || importance > TASK_CONSTANTS.maxImportance) {
          errors.push(
            `Ligne ${i + 1}: Importance invalide (doit être entre 0 et ${TASK_CONSTANTS.maxImportance})`
          )
          continue
        }

        if (isNaN(complexity) || complexity < 1 || complexity > TASK_CONSTANTS.maxComplexity) {
          errors.push(
            `Ligne ${i + 1}: Complexité invalide (doit être entre 1 et ${TASK_CONSTANTS.maxComplexity})`
          )
          continue
        }

        if (isNaN(points) || points < 0 || points > TASK_CONSTANTS.maxPoints) {
          errors.push(
            `Ligne ${i + 1}: Points invalides (doit être entre 0 et ${TASK_CONSTANTS.maxPoints})`
          )
          continue
        }

        let plannedDate: Date | undefined
        if (plannedDateStr && plannedDateStr.trim() !== '') {
          plannedDate = new Date(plannedDateStr)
          if (isNaN(plannedDate.getTime())) {
            errors.push(`Ligne ${i + 1}: Date prévue invalide`)
            continue
          }
        }

        let dueDate: Date | undefined
        if (dueDateStr && dueDateStr.trim() !== '') {
          dueDate = new Date(dueDateStr)
          if (isNaN(dueDate.getTime())) {
            errors.push(`Ligne ${i + 1}: Date limite invalide`)
            continue
          }
        }

        const tagNames = tagNamesStr
          ? tagNamesStr.split(';').filter((tag) => tag.trim() !== '')
          : []

        const tagColors = tagColorsStr
          ? tagColorsStr.split(';').map((color) => color.trim() !== '' ? color.trim() : null)
          : []

        // S'assurer que tagColors a la même longueur que tagNames
        while (tagColors.length < tagNames.length) {
          tagColors.push(null)
        }

        tasks.push({
          name: name.trim(),
          link: link && link.trim() !== '' ? link.trim() : undefined,
          note: note && note.trim() !== '' ? note.trim() : undefined,
           importance,
           complexity,
           points,
           plannedDate,
           dueDate,
          parentName:
            parentName && parentName.trim() !== ''
              ? parentName.trim()
              : undefined,
          tagNames,
          tagColors
        })
      } catch (error) {
        errors.push(`Ligne ${i + 1}: Erreur de parsing - ${error}`)
      }
    }

    return { tasks, errors }
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
   */
  private static parseCSVLine(line: string): string[] {
    const columns: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Guillemet échappé
          current += '"'
          i++ // Skip next quote
        } else {
          // Début ou fin de guillemets
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Fin de colonne
        columns.push(current)
        current = ''
      } else {
        current += char
      }
    }

    // Ajouter la dernière colonne
    columns.push(current)

    return columns
  }
}
