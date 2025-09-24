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
          case 'this-week':
            const endOfWeek = new Date(today)
            endOfWeek.setDate(today.getDate() + 7)
            return taskDate >= today && taskDate <= endOfWeek
          case 'future':
            return taskDate > tomorrow
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
      dateFilter
    ]
  )

  const clearAllFilters = () => {
    setSearchTerm('')
    setImportanceFilter('')
    setComplexityFilter('')
    setTagFilter('')
    setDateFilter('')
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
      importanceFilter !== '' ||
      complexityFilter !== '' ||
      tagFilter ||
      dateFilter
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
    filteredTasks,
    clearAllFilters,
    hasActiveFilters
  }
}
