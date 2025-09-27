import { TaskEntity } from '../entities/Task'

/**
 * UI-specific service for task priority display and styling
 * Contains presentation logic that depends on UI frameworks
 */
export class TaskPriorityUIService {
  /**
   * Calculate points based on importance and complexity
   */
  static calculatePoints(importance: number, complexity: number): number {
    if (complexity === 0) return 0
    return Math.round(10 * importance / complexity)
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
   * Get priority level description
   */
  static getPriorityDescription(importance: number): string {
    if (importance >= 45) return 'Critique'
    if (importance >= 35) return 'Très élevée'
    if (importance >= 25) return 'Élevée'
    if (importance >= 15) return 'Moyenne'
    if (importance >= 5) return 'Faible'
    return 'Très faible'
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
   * Get points badge color based on points value
   */
  static getPointsBadgeColor(points: number): string {
    if (points >= 400) return 'bg-red-500 text-white'
    if (points >= 300) return 'bg-orange-500 text-white'
    if (points >= 200) return 'bg-yellow-500 text-black'
    if (points >= 100) return 'bg-blue-500 text-white'
    if (points >= 50) return 'bg-green-500 text-white'
    return 'bg-gray-500 text-white'
  }

  /**
   * Determine if task is high priority
   */
  static isHighPriority(task: TaskEntity | { points: number; importance: number }): boolean {
    const points = task.points
    const importance = task.importance
    return points >= 200 || importance >= 30
  }

  /**
   * Determine if task is low priority
   */
  static isLowPriority(task: TaskEntity | { points: number; importance: number }): boolean {
    const points = task.points
    const importance = task.importance
    return points < 50 && importance < 10
  }

  /**
   * Get priority score (0-100) for comparison
   */
  static getPriorityScore(task: TaskEntity | { points: number; importance: number }): number {
    const points = task.points
    const importance = task.importance

    // Combine points and importance with different weights
    const pointsScore = Math.min(points / 5, 100) // Max 500 points = 100 score
    const importanceScore = importance * 2 // Max 50 importance = 100 score

    // Weighted average: 60% points, 40% importance
    return Math.round(pointsScore * 0.6 + importanceScore * 0.4)
  }

  /**
   * Sort tasks by priority (higher priority first)
   */
  static sortByPriority(tasks: Array<{ points: number; importance: number; complexity: number }>): Array<{ points: number; importance: number; complexity: number }> {
    return [...tasks].sort((a, b) => {
      // First sort by points (descending)
      if (b.points !== a.points) {
        return b.points - a.points
      }

      // Then by importance (descending)
      if (b.importance !== a.importance) {
        return b.importance - a.importance
      }

      // Finally by complexity (ascending - easier tasks first for same importance)
      return a.complexity - b.complexity
    })
  }

  /**
   * Group tasks by priority level
   */
  static groupTasksByPriority(tasks: Array<{ points: number; importance: number }>): {
    critical: Array<{ points: number; importance: number }>
    high: Array<{ points: number; importance: number }>
    medium: Array<{ points: number; importance: number }>
    low: Array<{ points: number; importance: number }>
  } {
    const groups = {
      critical: [] as Array<{ points: number; importance: number }>,
      high: [] as Array<{ points: number; importance: number }>,
      medium: [] as Array<{ points: number; importance: number }>,
      low: [] as Array<{ points: number; importance: number }>
    }

    tasks.forEach(task => {
      const score = this.getPriorityScore(task)

      if (score >= 80) {
        groups.critical.push(task)
      } else if (score >= 60) {
        groups.high.push(task)
      } else if (score >= 30) {
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
  static analyzeTaskDifficulty(tasks: Array<{ complexity: number; importance: number; points: number }>): {
    averageComplexity: number
    averageImportance: number
    averagePoints: number
    complexityDistribution: Record<number, number>
    importanceDistribution: Record<number, number>
  } {
    if (tasks.length === 0) {
      return {
        averageComplexity: 0,
        averageImportance: 0,
        averagePoints: 0,
        complexityDistribution: {},
        importanceDistribution: {}
      }
    }

    const totalComplexity = tasks.reduce((sum, task) => sum + task.complexity, 0)
    const totalImportance = tasks.reduce((sum, task) => sum + task.importance, 0)
    const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0)

    const complexityDistribution: Record<number, number> = {}
    const importanceDistribution: Record<number, number> = {}

    tasks.forEach(task => {
      complexityDistribution[task.complexity] = (complexityDistribution[task.complexity] || 0) + 1
      importanceDistribution[task.importance] = (importanceDistribution[task.importance] || 0) + 1
    })

    return {
      averageComplexity: Math.round(totalComplexity / tasks.length * 10) / 10,
      averageImportance: Math.round(totalImportance / tasks.length * 10) / 10,
      averagePoints: Math.round(totalPoints / tasks.length * 10) / 10,
      complexityDistribution,
      importanceDistribution
    }
  }
}