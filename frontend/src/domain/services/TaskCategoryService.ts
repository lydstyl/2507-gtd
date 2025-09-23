import { TaskEntity, TaskCategory } from '../entities/Task'

export class TaskCategoryService {
  /**
   * Get task category with display styles
   */
  static getCategoryStyle(category: TaskCategory) {
    const styles = {
      collected: {
        borderColor: 'border-l-purple-500',
        backgroundColor: 'bg-white',
        label: 'Collecté',
        textColor: 'text-purple-700'
      },
      overdue: {
        borderColor: 'border-l-red-500',
        backgroundColor: 'bg-red-50',
        label: 'En retard',
        textColor: 'text-red-700'
      },
      today: {
        borderColor: 'border-l-blue-500',
        backgroundColor: 'bg-blue-50',
        label: "Aujourd'hui",
        textColor: 'text-blue-700'
      },
      tomorrow: {
        borderColor: 'border-l-green-500',
        backgroundColor: 'bg-green-50',
        label: 'Demain',
        textColor: 'text-green-700'
      },
      'no-date': {
        borderColor: 'border-l-gray-400',
        backgroundColor: 'bg-white',
        label: 'Sans date',
        textColor: 'text-gray-600'
      },
      future: {
        borderColor: 'border-l-amber-500',
        backgroundColor: 'bg-amber-50',
        label: 'Futur',
        textColor: 'text-amber-700'
      }
    }

    return styles[category]
  }

  /**
   * Get priority order for categories (lower number = higher priority)
   */
  static getCategoryPriority(category: TaskCategory): number {
    const priorities = {
      collected: 1,
      overdue: 2,
      today: 3,
      tomorrow: 4,
      'no-date': 5,
      future: 6
    }

    return priorities[category]
  }

  /**
   * Group tasks by category
   */
  static groupTasksByCategory(tasks: TaskEntity[]): Record<TaskCategory, TaskEntity[]> {
    const groups: Record<TaskCategory, TaskEntity[]> = {
      collected: [],
      overdue: [],
      today: [],
      tomorrow: [],
      'no-date': [],
      future: []
    }

    tasks.forEach(task => {
      const category = task.getCategory()
      groups[category].push(task)
    })

    return groups
  }

  /**
   * Get category statistics
   */
  static getCategoryStats(tasks: TaskEntity[]): Record<TaskCategory, number> {
    const stats: Record<TaskCategory, number> = {
      collected: 0,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      'no-date': 0,
      future: 0
    }

    tasks.forEach(task => {
      const category = task.getCategory()
      stats[category]++
    })

    return stats
  }

  /**
   * Filter tasks by category
   */
  static filterTasksByCategory(tasks: TaskEntity[], category: TaskCategory): TaskEntity[] {
    return tasks.filter(task => task.getCategory() === category)
  }

  /**
   * Get all categories with tasks
   */
  static getActiveCategories(tasks: TaskEntity[]): TaskCategory[] {
    const stats = this.getCategoryStats(tasks)
    return Object.entries(stats)
      .filter(([_, count]) => count > 0)
      .map(([category, _]) => category as TaskCategory)
  }
}