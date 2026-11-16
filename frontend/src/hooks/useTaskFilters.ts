import { useState, useMemo } from 'react'
import type { Task } from '../types/task'

export interface FilterState {
  searchTerm: string
  importanceFilter: number | ''
  importanceFilterType: 'exact' | 'gte'
  complexityFilter: number | ''
  complexityFilterType: 'exact' | 'gte'
  tagFilter: string
  dateFilters: string[]
  updatedAtFilter: string
  createdAtFilter: string
  statusFilters: string[]
}

const ALL_STATUSES = ['brouillon', 'pour_ia', 'collecte', 'pret', 'un_jour_peut_etre', 'completed']
const DEFAULT_STATUS_FILTERS = ['brouillon', 'pour_ia', 'collecte', 'pret']

// Catégories de date (mutuellement exclusives, couvrent toutes les tâches).
// Checkbox "afficher / masquer" comme pour les statuts.
export const DATE_CATEGORIES = ['overdue', 'today', 'tomorrow', 'this-week', 'future', 'no-date']
const DEFAULT_DATE_FILTERS: string[] = [...DATE_CATEGORIES]

export function useTaskFilters(tasks: Task[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [importanceFilter, setImportanceFilter] = useState<number | ''>('')
  const [importanceFilterType, setImportanceFilterType] = useState<
    'exact' | 'gte'
  >('gte')
  const [complexityFilter, setComplexityFilter] = useState<number | ''>('')
  const [complexityFilterType, setComplexityFilterType] = useState<
    'exact' | 'gte'
  >('gte')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [dateFilters, setDateFilters] = useState<string[]>(DEFAULT_DATE_FILTERS)
  const [updatedAtFilter, setUpdatedAtFilter] = useState<string>('')
  const [createdAtFilter, setCreatedAtFilter] = useState<string>('')
  const [statusFilters, setStatusFilters] = useState<string[]>(DEFAULT_STATUS_FILTERS)

  const applyFilters = (tasksToFilter: Task[]) => {
    let filtered = tasksToFilter

    // Filter by status checkboxes
    filtered = filtered.filter((task) => {
      // Completed tasks only visible if "completed" checkbox is ticked
      if (task.isCompleted) {
        return statusFilters.includes('completed')
      }
      // Non-completed tasks: visible if their status is checked
      return statusFilters.includes(task.status)
    })

    // Text search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Importance filter
    if (importanceFilter !== '') {
      if (importanceFilterType === 'exact') {
        filtered = filtered.filter(
          (task) => task.importance === importanceFilter
        )
      } else {
        filtered = filtered.filter(
          (task) => task.importance >= importanceFilter
        )
      }
    }

    // Complexity filter
    if (complexityFilter !== '') {
      if (complexityFilterType === 'exact') {
        filtered = filtered.filter(
          (task) => task.complexity === complexityFilter
        )
      } else {
        filtered = filtered.filter(
          (task) => task.complexity <= complexityFilter
        )
      }
    }

    // Tag filter
    if (tagFilter) {
      filtered = filtered.filter((task) =>
        task.tags.some((tag) => tag.id === tagFilter)
      )
    }

    // Date filter (checkboxes afficher / masquer)
    if (dateFilters.length < DATE_CATEGORIES.length) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const endOfWeek = new Date(today)
      endOfWeek.setDate(endOfWeek.getDate() + 7)

      const getDateCategory = (task: Task): string => {
        if (!task.plannedDate) return 'no-date'
        const taskDate = new Date(task.plannedDate)
        taskDate.setHours(0, 0, 0, 0)
        if (taskDate.getTime() < today.getTime()) return 'overdue'
        if (taskDate.getTime() === today.getTime()) return 'today'
        if (taskDate.getTime() === tomorrow.getTime()) return 'tomorrow'
        if (taskDate.getTime() <= endOfWeek.getTime()) return 'this-week'
        return 'future'
      }

      filtered = filtered.filter((task) =>
        dateFilters.includes(getDateCategory(task))
      )
    }

    // Updated at filter
    if (updatedAtFilter) {
      const now = new Date()
      filtered = filtered.filter((task) => {
        const updatedAt = new Date(task.updatedAt)
        const daysDiff = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))

        switch (updatedAtFilter) {
          case '1-month':
            return daysDiff >= 30
          case '3-months':
            return daysDiff >= 90
          case '6-months':
            return daysDiff >= 180
          default:
            return true
        }
      })
    }

    // Created at filter
    if (createdAtFilter) {
      const now = new Date()
      filtered = filtered.filter((task) => {
        const createdAt = new Date(task.createdAt)
        const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

        switch (createdAtFilter) {
          case '1-month':
            return daysDiff >= 30
          case '3-months':
            return daysDiff >= 90
          case '6-months':
            return daysDiff >= 180
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredTasks = useMemo(
    () => applyFilters(tasks),
    [
      tasks,
      searchTerm,
      importanceFilter,
      importanceFilterType,
      complexityFilter,
      complexityFilterType,
      tagFilter,
      dateFilters,
      updatedAtFilter,
      createdAtFilter,
      statusFilters
    ]
  )

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const toggleDateFilter = (category: string) => {
    setDateFilters((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setImportanceFilter('')
    setComplexityFilter('')
    setTagFilter('')
    setDateFilters(DEFAULT_DATE_FILTERS)
    setUpdatedAtFilter('')
    setCreatedAtFilter('')
    setStatusFilters(DEFAULT_STATUS_FILTERS)
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
      importanceFilter !== '' ||
      complexityFilter !== '' ||
      tagFilter ||
      dateFilters.length !== DATE_CATEGORIES.length ||
      !DATE_CATEGORIES.every((c) => dateFilters.includes(c)) ||
      updatedAtFilter ||
      createdAtFilter ||
      statusFilters.length !== DEFAULT_STATUS_FILTERS.length ||
      !DEFAULT_STATUS_FILTERS.every((s) => statusFilters.includes(s))
  )

  return {
    searchTerm,
    setSearchTerm,
    importanceFilter,
    setImportanceFilter,
    importanceFilterType,
    setImportanceFilterType,
    complexityFilter,
    setComplexityFilter,
    complexityFilterType,
    setComplexityFilterType,
    tagFilter,
    setTagFilter,
    dateFilters,
    toggleDateFilter,
    updatedAtFilter,
    setUpdatedAtFilter,
    createdAtFilter,
    setCreatedAtFilter,
    statusFilters,
    toggleStatusFilter,
    filteredTasks,
    clearAllFilters,
    hasActiveFilters
  }
}
