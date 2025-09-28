// Validation patterns and UI constants for the GTD application

// Validation patterns for input validation
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

// Feature flags for enabling/disabling functionality
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

// API constants for network operations
export const API_CONSTANTS = {
  TIMEOUT: 30000, // ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  CACHE_DURATION: 300000, // 5 minutes in ms
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 60000 // 1 minute
} as const