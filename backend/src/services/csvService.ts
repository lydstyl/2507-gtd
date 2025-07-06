import { Task, Tag, TaskTag } from '@prisma/client'

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
      'Urgence',
      'Priorité',
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
      task.urgency,
      task.priority,
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
      urgency: number
      priority: number
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
      urgency: number
      priority: number
      dueDate?: Date
      parentName?: string
      tagNames: string[]
    }> = []

    // Ignorer l'en-tête
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const columns = this.parseCSVLine(line)

      if (columns.length < 13) {
        errors.push(`Ligne ${i + 1}: Nombre de colonnes insuffisant (${columns.length} au lieu de 13)`)
        continue
      }

      try {
        const [
          id, // Ignoré lors de l'import
          name,
          link,
          note,
          importanceStr,
          urgencyStr,
          priorityStr,
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
        const urgency = parseInt(urgencyStr)
        const priority = parseInt(priorityStr)

        if (isNaN(importance) || importance < 1 || importance > 9) {
          errors.push(
            `Ligne ${i + 1}: Importance invalide (doit être entre 1 et 9)`
          )
          continue
        }

        if (isNaN(urgency) || urgency < 1 || urgency > 9) {
          errors.push(
            `Ligne ${i + 1}: Urgence invalide (doit être entre 1 et 9)`
          )
          continue
        }

        if (isNaN(priority) || priority < 1 || priority > 9) {
          errors.push(
            `Ligne ${i + 1}: Priorité invalide (doit être entre 1 et 9)`
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
          urgency,
          priority,
          dueDate,
          parentName:
            parentName && parentName.trim() !== '' ? parentName.trim() : undefined,
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
