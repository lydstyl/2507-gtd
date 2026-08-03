import { TaskEntity } from '../entities/Task'

/**
 * UI-specific service for task priority display and styling
 * Contains presentation logic that depends on UI frameworks
 */
export class TaskPriorityUIService {
  /**
   * Get priority color based on importance quadrant (100-499)
   */
  static getPriorityColor(importance: number): string {
    if (importance >= 400) return 'bg-red-500'
    if (importance >= 300) return 'bg-blue-500'
    if (importance >= 200) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  /**
   * Get priority level description (importance quadrant)
   */
  static getPriorityDescription(importance: number): string {
    if (importance >= 400) return 'Importante + Urgente 🔥'
    if (importance >= 300) return 'Importante 📌'
    if (importance >= 200) return 'Urgente ⚡'
    return 'Basique 🐢'
  }

  /**
   * Get complexity description
   */
  static getComplexityDescription(complexity: number): string {
    if (complexity >= 8) return 'Très complexe'
    if (complexity >= 6) return 'Complexe'
    if (complexity >= 4) return 'Modérée'
    if (complexity >= 2) return 'Simple'
    return 'Très simple'
  }

  /**
   * Determine if task is high priority
   */
  static isHighPriority(task: TaskEntity | { importance: number }): boolean {
    return task.importance >= 300
  }

  /**
   * Determine if task is low priority
   */
  static isLowPriority(task: TaskEntity | { importance: number }): boolean {
    return task.importance < 200
  }

  /**
   * Get priority score (100-499) for comparison
   */
  static getPriorityScore(task: TaskEntity | { importance: number }): number {
    return Math.max(100, Math.min(499, task.importance))
  }

  /**
   * Sort tasks by priority (higher priority first)
   */
  static sortByPriority(tasks: Array<{ importance: number; complexity: number }>): Array<{ importance: number; complexity: number }> {
    return [...tasks].sort((a, b) => {
      // Sort by importance (descending)
      if (b.importance !== a.importance) {
        return b.importance - a.importance
      }

      // Then by complexity (ascending - easier tasks first for same importance)
      return a.complexity - b.complexity
    })
  }

  /**
   * Group tasks by priority level
   */
  static groupTasksByPriority(tasks: Array<{ importance: number }>): {
    critical: Array<{ importance: number }>
    high: Array<{ importance: number }>
    medium: Array<{ importance: number }>
    low: Array<{ importance: number }>
  } {
    const groups = {
      critical: [] as Array<{ importance: number }>,
      high: [] as Array<{ importance: number }>,
      medium: [] as Array<{ importance: number }>,
      low: [] as Array<{ importance: number }>
    }

    tasks.forEach(task => {
      const importance = task.importance

      if (importance >= 400) {
        groups.critical.push(task)
      } else if (importance >= 300) {
        groups.high.push(task)
      } else if (importance >= 200) {
        groups.medium.push(task)
      } else {
        groups.low.push(task)
      }
    })

    return groups
  }

  /**
   * Calculate optimal task difficulty distribution
   */
  static analyzeTaskDifficulty(tasks: Array<{ complexity: number; importance: number }>): {
    averageComplexity: number
    averageImportance: number
    complexityDistribution: Record<number, number>
    importanceDistribution: Record<number, number>
  } {
    if (tasks.length === 0) {
      return {
        averageComplexity: 0,
        averageImportance: 0,
        complexityDistribution: {},
        importanceDistribution: {}
      }
    }

    const totalComplexity = tasks.reduce((sum, task) => sum + task.complexity, 0)
    const totalImportance = tasks.reduce((sum, task) => sum + task.importance, 0)

    const complexityDistribution: Record<number, number> = {}
    const importanceDistribution: Record<number, number> = {}

    tasks.forEach(task => {
      complexityDistribution[task.complexity] = (complexityDistribution[task.complexity] || 0) + 1
      importanceDistribution[task.importance] = (importanceDistribution[task.importance] || 0) + 1
    })

    return {
      averageComplexity: Math.round(totalComplexity / tasks.length * 10) / 10,
      averageImportance: Math.round(totalImportance / tasks.length * 10) / 10,
      complexityDistribution,
      importanceDistribution
    }
  }
}