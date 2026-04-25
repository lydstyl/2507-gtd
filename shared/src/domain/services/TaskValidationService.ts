/**
 * Service for task validation and business rules
 * Contains validation logic for task properties
 */
export class TaskValidationService {
  /**
   * Validate importance value (0-500, integer)
   */
  static validateImportance(importance: number): boolean {
    return Number.isInteger(importance) && importance >= 0 && importance <= 500
  }

  /**
   * Validate complexity value (1-9, integer)
   */
  static validateComplexity(complexity: number): boolean {
    return Number.isInteger(complexity) && complexity >= 1 && complexity <= 9
  }

  /**
   * Validate points value (0-500, integer)
   */
  static validatePoints(points: number): boolean {
    return Number.isInteger(points) && points >= 0 && points <= 500
  }

  /**
   * Get default values for new tasks
   */
  static getDefaultTaskValues() {
    return {
      importance: 500,
      complexity: 1,
      points: 500,
    }
  }

  /**
   * Get new default task values (brouillon status)
   */
  static getNewDefaultTaskValues() {
    return {
      importance: 0,
      complexity: 3,
      points: 0,
      status: 'brouillon' as const,
    }
  }

  /**
   * Check if task is a new default task (uses status field)
   * @deprecated Use task.status instead
   */
  static isNewDefaultTask(importance: number, complexity: number): boolean {
    return importance === 0 && complexity === 3
  }

  /**
   * Validate task name
   */
  static validateTaskName(name: string): boolean {
    const trimmed = name.trim()
    return trimmed.length > 0 && trimmed.length <= 200
  }

  /**
   * Validate date string format
   */
  static validateDateString(dateString: string): boolean {
    if (!dateString) return true // Optional field
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }
}