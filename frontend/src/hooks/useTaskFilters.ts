import { useState, useMemo } from 'react'
import type { Task } from '../types/task'

export interface FilterState {
  searchTerm: string
  importanceFilter: number | ''
  importanceFilterType: 'exact' | 'gte'
  complexityFilter: number | ''
  complexityFilterType: 'exact' | 'gte'
  tagFilter: string
  dateFilter: string
  updatedAtFilter: string
  createdAtFilter: string
}

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
  const [dateFilter, setDateFilter] = useState<string>('')
  const [updatedAtFilter, setUpdatedAtFilter] = useState<string>('')
  const [createdAtFilter, setCreatedAtFilter] = useState<string>('')

  const applyFilters = (tasksToFilter: Task[]) => {
    let filtered = tasksToFilter

    // Filter completed tasks
    filtered = filtered.filter((task) => !task.isCompleted)

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

    // Date filter
    if (dateFilter) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      filtered = filtered.filter((task) => {
        if (!task.plannedDate) {
          return dateFilter === 'no-date'
        }

        if (dateFilter === 'no-date') {
          return false
        }

        const taskDate = new Date(task.plannedDate)
        taskDate.setHours(0, 0, 0, 0)

        switch (dateFilter) {
          case 'overdue':
            return taskDate < today
          case 'today':
            return taskDate.getTime() === today.getTime()
          case 'tomorrow':
            return taskDate.getTime() === tomorrow.getTime()
          case 'this-week': {
            const endOfWeek = new Date(today)
            endOfWeek.setDate(today.getDate() + 7)
            return taskDate >= today && taskDate <= endOfWeek
          }
          case 'future':
            return taskDate > tomorrow
          default:
            return true
        }
      })
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
      dateFilter,
      updatedAtFilter,
      createdAtFilter
    ]
  )

  const clearAllFilters = () => {
    setSearchTerm('')
    setImportanceFilter('')
    setComplexityFilter('')
    setTagFilter('')
    setDateFilter('')
    setUpdatedAtFilter('')
    setCreatedAtFilter('')
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
      importanceFilter !== '' ||
      complexityFilter !== '' ||
      tagFilter ||
      dateFilter ||
      updatedAtFilter ||
      createdAtFilter
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
    dateFilter,
    setDateFilter,
    updatedAtFilter,
    setUpdatedAtFilter,
    createdAtFilter,
    setCreatedAtFilter,
    filteredTasks,
    clearAllFilters,
    hasActiveFilters
  }
}
