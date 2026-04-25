import { TaskCategory, GenericTaskWithSubtasks } from '../entities/TaskTypes'
import { TaskPriorityService } from './TaskPriorityService'

/**
 * Service for task category display and styling utilities
 * Contains presentation logic for task categories
 */
export class TaskCategoryService {
  /**
    * Get display information for a task category
    */
   static getCategoryDisplayInfo(category: TaskCategory) {
     const displayInfo = {
       brouillon: {
         label: 'Brouillon',
         borderColor: 'border-l-gray-400',
         backgroundColor: 'bg-gray-50',
         textColor: 'text-gray-600',
         icon: '✏️'
       },
       'pour-ia': {
         label: 'Pour IA',
         borderColor: 'border-l-violet-500',
         backgroundColor: 'bg-violet-50',
         textColor: 'text-violet-700',
         icon: '🤖'
       },
       collected: {
         label: 'Collecté',
         borderColor: 'border-l-purple-500',
         backgroundColor: 'bg-white',
         textColor: 'text-purple-700',
         icon: '📝'
       },
        'pret-overdue': {
          label: 'En retard',
          borderColor: 'border-l-red-500',
          backgroundColor: 'bg-red-50',
          textColor: 'text-red-700',
          icon: '⚠️'
        },
        'pret-today': {
          label: "Aujourd'hui",
          borderColor: 'border-l-blue-500',
          backgroundColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          icon: '📅'
        },
        'pret-tomorrow': {
          label: 'Demain',
          borderColor: 'border-l-green-500',
          backgroundColor: 'bg-green-50',
          textColor: 'text-green-700',
          icon: '🌅'
        },
        'pret-no-date': {
          label: 'Sans date',
          borderColor: 'border-l-gray-400',
          backgroundColor: 'bg-white',
          textColor: 'text-gray-600',
          icon: '📋'
        },
        'pret-future': {
          label: 'Futur',
          borderColor: 'border-l-amber-500',
          backgroundColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          icon: '🔮'
        },
       'un-jour': {
         label: 'Un jour peut-être',
         borderColor: 'border-l-sky-400',
         backgroundColor: 'bg-sky-50',
         textColor: 'text-sky-700',
         icon: '🌙'
       }
     }

     return displayInfo[category]
   }

  /**
   * Get task category with display styles (legacy method for frontend compatibility)
   */
  static getCategoryStyle(category: TaskCategory) {
    const displayInfo = this.getCategoryDisplayInfo(category)
    return {
      borderColor: displayInfo.borderColor,
      backgroundColor: displayInfo.backgroundColor,
      label: displayInfo.label,
      textColor: displayInfo.textColor
    }
  }

  /**
   * Get priority order for categories (lower number = higher priority)
   */
  static getCategoryPriority(category: TaskCategory): number {
    return TaskPriorityService.getCategoryPriority(category)
  }

  /**
   * Group tasks by category
   */
  static groupTasksByCategory<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): Record<TaskCategory, GenericTaskWithSubtasks<TDate>[]> {
    const groups: Record<TaskCategory, GenericTaskWithSubtasks<TDate>[]> = {
      brouillon: [],
      'pour-ia': [],
      collected: [],
      'pret-overdue': [],
      'pret-today': [],
      'pret-tomorrow': [],
      'pret-no-date': [],
      'pret-future': [],
      'un-jour': []
    }

    // Use TaskPriorityService for categorization
    const dateContext = TaskPriorityService.createDateContext()

    tasks.forEach(task => {
      const category = TaskPriorityService.getTaskCategory(task, dateContext)
      groups[category].push(task)
    })

    return groups
  }

  /**
   * Get category statistics
   */
  static getCategoryStats<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): Record<TaskCategory, number> {
    const groups = this.groupTasksByCategory(tasks)
    return {
      brouillon: groups.brouillon.length,
      'pour-ia': groups['pour-ia'].length,
      collected: groups.collected.length,
      'pret-overdue': groups['pret-overdue'].length,
      'pret-today': groups['pret-today'].length,
      'pret-tomorrow': groups['pret-tomorrow'].length,
      'pret-no-date': groups['pret-no-date'].length,
      'pret-future': groups['pret-future'].length,
      'un-jour': groups['un-jour'].length
    }
  }

  /**
   * Filter tasks by category
   */
  static filterTasksByCategory<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[],
    category: TaskCategory
  ): GenericTaskWithSubtasks<TDate>[] {
    const dateContext = TaskPriorityService.createDateContext()

    return tasks.filter(task =>
      TaskPriorityService.getTaskCategory(task, dateContext) === category
    )
  }

  /**
   * Get all categories with tasks
   */
  static getActiveCategories<TDate extends string | Date>(
    tasks: GenericTaskWithSubtasks<TDate>[]
  ): TaskCategory[] {
    const stats = this.getCategoryStats(tasks)
    return Object.entries(stats)
      .filter(([_, count]) => count > 0)
      .map(([category, _]) => category as TaskCategory)
  }

  /**
   * Get priority color based on importance level
   */
  static getPriorityColor(importance: number): string {
    switch (importance) {
      case 1:
        return 'bg-black'
      case 2:
        return 'bg-gray-800'
      case 3:
        return 'bg-gray-600'
      case 4:
        return 'bg-gray-400'
      case 5:
        return 'bg-gray-200'
      default:
        return 'bg-gray-300'
    }
  }

  /**
   * Get points color based on points value
   */
  static getPointsColor(points: number): string {
    // Clamp points between 0 and 500
    const clampedPoints = Math.max(0, Math.min(500, points))

    // Calculate intensity: 0 points = 0%, 500 points = 100%
    const intensity = clampedPoints / 500

    if (intensity === 0) {
      return 'bg-white'
    } else if (intensity === 1) {
      return 'bg-black'
    } else {
      // Generate gray levels from gray-100 (lightest) to gray-900 (darkest)
      // Map intensity 0.1-0.9 to gray levels 100-900
      const grayLevel = Math.round(intensity * 9) * 100
      return `bg-gray-${grayLevel}`
    }
  }

  /**
   * Get date indicator for special days (Wednesday, weekends)
   */
  static getDateIndicator(dateString: string) {
    try {
      const date = new Date(dateString)
      const dayOfWeek = date.getDay()

      if (dayOfWeek === 3) { // Wednesday
        return {
          icon: '🌿',
          tooltip: 'Mercredi',
          className: 'text-green-600'
        }
      } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        return {
          icon: '🏖️',
          tooltip: 'Week-end',
          className: 'text-orange-600'
        }
      }

      return null
    } catch {
      return null
    }
  }
}
