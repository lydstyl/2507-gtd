// Business rules and constants for the GTD application
// These define the core business constraints and validation rules

// Task business rules interface
export interface TaskBusinessRules {
  maxImportance: number
  maxComplexity: number
  maxPoints: number
  collectedThreshold: number
  overdueGracePeriod: number // days
  maxSubtaskDepth: number
  maxTagsPerTask: number
  taskNameMaxLength: number
  taskNoteMaxLength: number
  taskLinkMaxLength: number
}

// Tag business rules interface
export interface TagBusinessRules {
  nameMaxLength: number
  nameMinLength: number
  maxTagsPerTask: number
  allowedColors: string[]
  reservedNames: string[]
  caseSensitive: boolean
  allowDuplicateNames: boolean
}

// Task business constants
export const TASK_CONSTANTS: TaskBusinessRules = {
  maxImportance: 50,
  maxComplexity: 9,
  maxPoints: 500,
  collectedThreshold: 500,
  overdueGracePeriod: 0, // No grace period
  maxSubtaskDepth: 10,
  maxTagsPerTask: 10,
  taskNameMaxLength: 200,
  taskNoteMaxLength: 10000,
  taskLinkMaxLength: 500
}

// Tag business constants
export const TAG_CONSTANTS: TagBusinessRules = {
  nameMaxLength: 50,
  nameMinLength: 1,
  maxTagsPerTask: 10,
  allowedColors: [
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#F59E0B', // amber-500
    '#EAB308', // yellow-500
    '#84CC16', // lime-500
    '#22C55E', // green-500
    '#10B981', // emerald-500
    '#06B6D4', // cyan-500
    '#3B82F6', // blue-500
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#A855F7', // purple-500
    '#EC4899', // pink-500
    '#F43F5E', // rose-500
    '#6B7280', // gray-500
    '#374151', // gray-700
  ],
  reservedNames: ['all', 'none', 'untagged', 'system'],
  caseSensitive: false,
  allowDuplicateNames: false
}

// Priority levels for task categorization
export const PRIORITY_LEVELS = {
  CRITICAL: { min: 400, label: 'Critique', color: 'red' },
  HIGH: { min: 300, label: 'Élevée', color: 'orange' },
  MEDIUM: { min: 200, label: 'Moyenne', color: 'yellow' },
  LOW: { min: 100, label: 'Faible', color: 'blue' },
  MINIMAL: { min: 0, label: 'Minimale', color: 'gray' }
} as const

// Complexity levels for task assessment
export const COMPLEXITY_LEVELS = {
  VERY_SIMPLE: { value: 1, label: 'Très simple' },
  SIMPLE: { value: 2, label: 'Simple' },
  MODERATE: { value: 3, label: 'Modérée' },
  COMPLEX: { value: 5, label: 'Complexe' },
  VERY_COMPLEX: { value: 8, label: 'Très complexe' }
} as const

// Importance levels for task assessment
export const IMPORTANCE_LEVELS = {
  MINIMAL: { value: 1, label: 'Minimale' },
  LOW: { value: 10, label: 'Faible' },
  MEDIUM: { value: 25, label: 'Moyenne' },
  HIGH: { value: 35, label: 'Élevée' },
  CRITICAL: { value: 45, label: 'Critique' }
} as const

// Date range constants for filtering and categorization
export const DATE_RANGES = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  THIS_WEEK: 'this-week',
  NEXT_WEEK: 'next-week',
  THIS_MONTH: 'this-month',
  OVERDUE: 'overdue',
  NO_DATE: 'no-date'
} as const

// Sort direction constants
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
} as const

// Task category constants for UI organization
export const TASK_CATEGORIES = {
  COLLECTED: 'collected',
  OVERDUE: 'overdue',
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  NO_DATE: 'no-date',
  FUTURE: 'future'
} as const

// Workflow states for GTD methodology
export const WORKFLOW_STATES = {
  INBOX: 'inbox',
  NEXT: 'next',
  WAITING: 'waiting',
  SOMEDAY: 'someday',
  COMPLETED: 'completed'
} as const