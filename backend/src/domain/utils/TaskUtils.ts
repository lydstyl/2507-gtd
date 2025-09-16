/**
 * Utility functions for task management and points calculation
 */

/**
 * Computes points based on importance and complexity
 * Formula: points = round(10 * importance / complexity), clamped to [0, 500]
 */
export function computePoints(importance: number, complexity: number): number {
  // Validate inputs
  const validImportance = Math.max(0, Math.min(50, importance))
  const validComplexity = Math.max(1, Math.min(9, complexity))

  // Compute points
  const points = Math.round(10 * validImportance / validComplexity)

  // Clamp to valid range
  return Math.max(0, Math.min(500, points))
}

/**
 * Validates importance value
 */
export function validateImportance(importance: number): boolean {
  return Number.isInteger(importance) && importance >= 0 && importance <= 50
}

/**
 * Validates complexity value
 */
export function validateComplexity(complexity: number): boolean {
  return Number.isInteger(complexity) && complexity >= 1 && complexity <= 9
}

/**
 * Gets default values for new tasks
 */
export function getDefaultTaskValues() {
  return {
    importance: 50, // Maximum importance for high priority
    complexity: 1,  // Minimum complexity for maximum points
    points: 500,    // 10 * 50 / 1 = 500 (maximum points)
  }
}