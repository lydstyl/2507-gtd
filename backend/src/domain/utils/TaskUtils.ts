import { TaskValidationService, TaskPriorityService } from '@gtd/shared'

/**
 * Utility functions for task management and points calculation
 * @deprecated Use TaskValidationService from @gtd/shared instead
 */

/**
 * Computes points based on importance and complexity
 * @deprecated Use TaskPriorityService.calculatePoints from @gtd/shared
 */
export function computePoints(importance: number, complexity: number): number {
  // Clamp values to valid ranges like the old implementation
  const validImportance = Math.max(0, Math.min(50, importance))
  const validComplexity = Math.max(1, Math.min(9, complexity))

  return TaskPriorityService.calculatePoints(validImportance, validComplexity)
}

/**
 * Validates importance value
 * @deprecated Use TaskValidationService.validateImportance from @gtd/shared
 */
export function validateImportance(importance: number): boolean {
  return TaskValidationService.validateImportance(importance)
}

/**
 * Validates complexity value
 * @deprecated Use TaskValidationService.validateComplexity from @gtd/shared
 */
export function validateComplexity(complexity: number): boolean {
  return TaskValidationService.validateComplexity(complexity)
}

/**
 * Gets default values for new tasks
 * @deprecated Use TaskValidationService.getDefaultTaskValues from @gtd/shared
 */
export function getDefaultTaskValues() {
  return TaskValidationService.getDefaultTaskValues()
}