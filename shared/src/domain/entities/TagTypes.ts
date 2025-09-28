/**
 * Shared Tag Domain Types
 * Consolidated from frontend and backend tag-related types
 */

// Import and re-export basic tag types from TaskTypes
import type { TagBase, BackendTag, FrontendTag } from './TaskTypes'
export type { TagBase, BackendTag, FrontendTag } from './TaskTypes'

// Tag filtering and search
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

// Tag analytics and statistics
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

// Tag sorting
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

// Tag relationships (for future hierarchical or related tag features)
export interface TagRelationship {
  parent?: string
  children: string[]
  related: string[]
  conflicts: string[]
}

// Re-export tag business rules from constants (avoid duplication)
export type { TagBusinessRules } from '../constants/BusinessRules'

// Tag import/export
export interface TagImportResult {
  imported: number
  skipped: number
  merged: number
  errors: Array<{
    row: number
    message: string
    data?: unknown
  }>
}

export interface TagExportOptions {
  format: 'csv' | 'json'
  includeStats: boolean
  includeTaskCounts: boolean
}

// Backend-specific tag types (maintaining position field for backend compatibility)
export interface BackendTagWithPosition extends BackendTag {
  position: number
}

export interface CreateTagData {
  name: string
  color?: string
  position?: number
  userId: string
}

export interface UpdateTagData {
  name?: string
  color?: string
  position?: number
  userId?: string
}

// Tag validation constraints (used by TagValidationService)
export interface TagValidationConstraints {
  name: {
    minLength: number
    maxLength: number
    pattern?: RegExp
    reservedNames: string[]
  }
  color: {
    pattern: RegExp
    allowedValues?: string[]
  }
  business: {
    maxTagsPerTask: number
    caseSensitive: boolean
    allowDuplicateNames: boolean
  }
}

// Tag operation results
export interface TagOperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: string[]
}

// Tag query and filtering types for repositories
export interface TagQuery {
  search?: string
  userId: string
  color?: string
  includeTaskCounts?: boolean
  sortBy?: TagSortField
  sortDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface TagWithTaskCount extends TagBase<string | Date> {
  taskCount: number
}