import { Task, TaskTag } from '../domain/entities/Task'
import { Tag } from '../domain/entities/Tag'

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
      'Collection',
      'Date limite',
      'Date de création',
      'Date de modification',
      'Tâche parente',
      'Nom tâche parente',
      'Tags'
    ]

    const rows = tasks.map((task) => [
      task.id,
      `"${task.name.replace(/"/g, '""')}"`, // Échapper les guillemets
      task.link ? `"${task.link.replace(/"/g, '""')}"` : '',
      task.note ? `"${task.note.replace(/"/g, '""')}"` : '',
      task.importance,
      task.complexity,
      task.points,
      task.isCollection ? 'true' : 'false',
      task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      task.createdAt.toISOString().split('T')[0],
      task.updatedAt.toISOString().split('T')[0],
      task.parentId || '',
      task.parentName || '',
      task.tags.map((t) => t.tag.name).join(';')
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
      isCollection: boolean
      dueDate?: Date
      parentName?: string
      tagNames: string[]
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
      isCollection: boolean
      dueDate?: Date
      parentName?: string
      tagNames: string[]
    }> = []

    // Ignorer l'en-tête
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const columns = this.parseCSVLine(line)

      if (columns.length < 14) {
        errors.push(
          `Ligne ${i + 1}: Nombre de colonnes insuffisant (${
            columns.length
          } au lieu de 14)`
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
          isCollectionStr,
          dueDateStr,
          createdAtStr, // Ignoré lors de l'import
          updatedAtStr, // Ignoré lors de l'import
          parentId, // Ignoré lors de l'import
          parentName,
          tagNamesStr
        ] = columns

        // Validation des données
        if (!name || name.trim() === '') {
          errors.push(`Ligne ${i + 1}: Le nom de la tâche est requis`)
          continue
        }

        const importance = parseInt(importanceStr)
        const complexity = parseInt(complexityStr)
        const points = parseInt(pointsStr)
        const isCollection = isCollectionStr?.toLowerCase() === 'true'

        if (isNaN(importance) || importance < 0 || importance > 50) {
          errors.push(
            `Ligne ${i + 1}: Importance invalide (doit être entre 0 et 50)`
          )
          continue
        }

        if (isNaN(complexity) || complexity < 1 || complexity > 9) {
          errors.push(
            `Ligne ${i + 1}: Complexité invalide (doit être entre 1 et 9)`
          )
          continue
        }

        if (isNaN(points) || points < 0 || points > 500) {
          errors.push(
            `Ligne ${i + 1}: Points invalides (doit être entre 0 et 500)`
          )
          continue
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

        tasks.push({
          name: name.trim(),
          link: link && link.trim() !== '' ? link.trim() : undefined,
          note: note && note.trim() !== '' ? note.trim() : undefined,
          importance,
          complexity,
          points,
          isCollection,
          dueDate,
          parentName:
            parentName && parentName.trim() !== ''
              ? parentName.trim()
              : undefined,
          tagNames
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
