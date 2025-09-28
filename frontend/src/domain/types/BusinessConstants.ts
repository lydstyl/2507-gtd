// Re-export constants from shared domain package
// This maintains backward compatibility while centralizing business rules

export {
  TASK_CONSTANTS,
  TAG_CONSTANTS,
  PRIORITY_LEVELS,
  COMPLEXITY_LEVELS,
  IMPORTANCE_LEVELS,
  DATE_RANGES,
  SORT_DIRECTIONS,
  TASK_CATEGORIES,
  WORKFLOW_STATES,
  VALIDATION_PATTERNS,
  UI_CONSTANTS,
  FEATURE_FLAGS,
  API_CONSTANTS,
  type TaskBusinessRules,
  type TagBusinessRules
} from '@gtd/shared'