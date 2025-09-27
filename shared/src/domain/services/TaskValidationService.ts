/**
 * Service for task validation and business rules
 * Contains validation logic for task properties
 */
export class TaskValidationService {
  /**
   * Validate importance value (0-50, integer)
   */
  static validateImportance(importance: number): boolean {
    return Number.isInteger(importance) && importance >= 0 && importance <= 50
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
      importance: 50, // Maximum importance for high priority
      complexity: 1,  // Minimum complexity for maximum points
      points: 500,    // 10 * 50 / 1 = 500 (maximum points)
    }
  }

  /**
   * Get new default task values (collected tasks)
   */
  static getNewDefaultTaskValues() {
    return {
      importance: 0, // No importance assigned yet
      complexity: 3, // Medium complexity
      points: 0,     // No points until categorized
    }
  }

  /**
   * Check if task is a new default task (collected)
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