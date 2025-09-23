// Tag domain types

export interface TagFilters {
  search?: string
  color?: string
  hasColor?: boolean
  taskCount?: {
    min?: number
    max?: number
  }
  recentlyUsed?: boolean
  createdInLastDays?: number
}

export interface TagStats {
  totalTags: number
  tagsWithColor: number
  averageTasksPerTag: number
  mostUsedTags: Array<{
    id: string
    name: string
    taskCount: number
  }>
  leastUsedTags: Array<{
    id: string
    name: string
    taskCount: number
  }>
  colorDistribution: Record<string, number>
  recentlyCreated: number
}

export interface TagUsageAnalytics {
  tagId: string
  name: string
  taskCount: number
  completedTaskCount: number
  averageTaskPoints: number
  completionRate: number
  firstUsed: Date
  lastUsed: Date
  usageFrequency: 'high' | 'medium' | 'low'
  trending: 'up' | 'down' | 'stable'
}

export type TagSortField = 'name' | 'createdAt' | 'taskCount' | 'color'

export interface TagSortOptions {
  field: TagSortField
  direction: 'asc' | 'desc'
}

// Tag color system
export interface TagColorPalette {
  primary: string[]
  secondary: string[]
  neutral: string[]
  custom: string[]
}

export interface TagColorInfo {
  hex: string
  name: string
  category: 'primary' | 'secondary' | 'neutral' | 'custom'
  contrastColor: string
  brightness: 'light' | 'dark'
}

// Tag relationships
export interface TagRelationship {
  parent?: string
  children: string[]
  related: string[]
  conflicts: string[]
}

// Tag business rules
export interface TagBusinessRules {
  nameMaxLength: number
  nameMinLength: number
  maxTagsPerTask: number
  allowedColors: string[]
  reservedNames: string[]
  caseSensitive: boolean
  allowDuplicateNames: boolean
}

// Tag import/export
export interface TagImportResult {
  imported: number
  skipped: number
  merged: number
  errors: Array<{
    row: number
    message: string
    data?: any
  }>
}

export interface TagExportOptions {
  format: 'csv' | 'json'
  includeStats: boolean
  includeTaskCounts: boolean
}