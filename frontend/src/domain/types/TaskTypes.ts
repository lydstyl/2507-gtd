import { TaskCategory } from '../entities/Task'

// Task filtering and search types
export interface TaskFilters {
  search?: string
  importance?: {
    value: number
    type: 'exact' | 'gte' | 'lte'
  }
  urgency?: {
    value: number
    type: 'exact' | 'gte' | 'lte'
  }
  priority?: {
    value: number
    type: 'exact' | 'gte' | 'lte'
  }
  tagIds?: string[]
  category?: TaskCategory
  dateFilter?: 'today' | 'tomorrow' | 'overdue' | 'this-week' | 'no-date'
  isCompleted?: boolean
  hasSubtasks?: boolean
  parentId?: string | null
}

// Task sorting types
export type TaskSortField =
  | 'priority'
  | 'plannedDate'
  | 'createdAt'
  | 'completedAt'
  | 'name'
  | 'importance'
  | 'complexity'
  | 'points'

export interface TaskSortOptions {
  field: TaskSortField
  direction: 'asc' | 'desc'
}

// Task statistics types
export interface TaskStats {
  total: number
  completed: number
  overdue: number
  dueToday: number
  dueTomorrow: number
  collected: number
  noDate: number
  future: number
  averagePoints: number
  averageImportance: number
  averageComplexity: number
}

export interface TaskCategoryStats {
  [key in TaskCategory]: {
    count: number
    percentage: number
    averagePoints: number
  }
}

// Task priority analysis
export interface TaskPriorityAnalysis {
  highPriority: number
  mediumPriority: number
  lowPriority: number
  distribution: {
    importance: Record<number, number>
    complexity: Record<number, number>
    points: Record<number, number>
  }
}

// Task completion analysis
export interface TaskCompletionStats {
  dailyCompletions: Array<{
    date: string
    count: number
    tasks: Array<{
      id: string
      name: string
      points: number
    }>
  }>
  weeklyCompletions: Array<{
    weekStart: string
    count: number
  }>
  monthlyCompletions: Array<{
    month: string
    count: number
  }>
  averageCompletionTime: number // in days
  productivityTrends: {
    thisWeek: number
    lastWeek: number
    trend: 'up' | 'down' | 'stable'
  }
}

// Task performance metrics
export interface TaskPerformanceMetrics {
  totalPointsEarned: number
  averageTaskPoints: number
  completionRate: number
  overdueRate: number
  onTimeCompletionRate: number
  averageDaysToComplete: number
  productivityScore: number // 0-100
}

// Task business rules
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
}

// Task import/export types
export interface TaskImportResult {
  imported: number
  skipped: number
   errors: Array<{
     row: number
     message: string
     data?: unknown
   }>
}

export interface TaskExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  includeSubtasks: boolean
  includeCompleted: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  fields?: string[]
}

// Task search types
export interface TaskSearchOptions {
  query: string
  searchFields: Array<'name' | 'note' | 'tags'>
  fuzzy: boolean
  maxResults?: number
  highlightMatches: boolean
}

export interface TaskSearchResult {
  tasks: Array<{
    id: string
    name: string
    relevanceScore: number
    highlights: Array<{
      field: string
      text: string
      positions: Array<{ start: number; end: number }>
    }>
  }>
  totalCount: number
  searchTime: number
}

// Task relationship types
export interface TaskRelationship {
  parentId: string | null
  hasSubtasks: boolean
  subtaskCount: number
  depth: number
  siblings: string[]
  ancestors: string[]
  descendants: string[]
}

// Task workflow types
export type TaskWorkflowState = 'inbox' | 'next' | 'waiting' | 'someday' | 'completed'

export interface TaskWorkflow {
  state: TaskWorkflowState
  transitions: TaskWorkflowState[]
  rules: {
    canTransitionTo: (newState: TaskWorkflowState) => boolean
    requiresConfirmation: (newState: TaskWorkflowState) => boolean
  }
}