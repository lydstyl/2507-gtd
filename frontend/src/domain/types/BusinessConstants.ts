import { TaskBusinessRules, TagBusinessRules } from '.'

// Business constants and rules for the GTD application

export const TASK_CONSTANTS: TaskBusinessRules = {
  maxImportance: 50,
  maxComplexity: 9,
  maxPoints: 500,
  collectedThreshold: 500,
  overdueGracePeriod: 0, // No grace period
  maxSubtaskDepth: 10,
  maxTagsPerTask: 10,
  taskNameMaxLength: 200,
  taskNoteMaxLength: 10000
}

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

export const PRIORITY_LEVELS = {
  CRITICAL: { min: 400, label: 'Critique', color: 'red' },
  HIGH: { min: 300, label: 'Élevée', color: 'orange' },
  MEDIUM: { min: 200, label: 'Moyenne', color: 'yellow' },
  LOW: { min: 100, label: 'Faible', color: 'blue' },
  MINIMAL: { min: 0, label: 'Minimale', color: 'gray' }
} as const

export const COMPLEXITY_LEVELS = {
  VERY_SIMPLE: { value: 1, label: 'Très simple' },
  SIMPLE: { value: 2, label: 'Simple' },
  MODERATE: { value: 3, label: 'Modérée' },
  COMPLEX: { value: 5, label: 'Complexe' },
  VERY_COMPLEX: { value: 8, label: 'Très complexe' }
} as const

export const IMPORTANCE_LEVELS = {
  MINIMAL: { value: 1, label: 'Minimale' },
  LOW: { value: 10, label: 'Faible' },
  MEDIUM: { value: 25, label: 'Moyenne' },
  HIGH: { value: 35, label: 'Élevée' },
  CRITICAL: { value: 45, label: 'Critique' }
} as const

export const DATE_RANGES = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  THIS_WEEK: 'this-week',
  NEXT_WEEK: 'next-week',
  THIS_MONTH: 'this-month',
  OVERDUE: 'overdue',
  NO_DATE: 'no-date'
} as const

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
} as const

export const TASK_CATEGORIES = {
  COLLECTED: 'collected',
  OVERDUE: 'overdue',
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  NO_DATE: 'no-date',
  FUTURE: 'future'
} as const

export const WORKFLOW_STATES = {
  INBOX: 'inbox',
  NEXT: 'next',
  WAITING: 'waiting',
  SOMEDAY: 'someday',
  COMPLETED: 'completed'
} as const

// Validation constants
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  TASK_NAME: /^.{1,200}$/,
  TAG_NAME: /^[a-zA-Z0-9\s\-_]{1,50}$/
} as const

// Performance and UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300, // ms
  ANIMATION_DURATION: 200, // ms
  TOAST_DURATION: 5000, // ms
  AUTO_SAVE_DELAY: 2000, // ms
  PAGINATION_DEFAULT_SIZE: 50,
  SEARCH_MIN_CHARACTERS: 2,
  MAX_RECENT_ITEMS: 10
} as const

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_SUBTASKS: true,
  ENABLE_TAGS: true,
  ENABLE_NOTES: true,
  ENABLE_CSV_IMPORT: true,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_ANALYTICS: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_KEYBOARD_SHORTCUTS: true
} as const

// API constants
export const API_CONSTANTS = {
  TIMEOUT: 30000, // ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  CACHE_DURATION: 300000, // 5 minutes in ms
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 60000 // 1 minute
} as const