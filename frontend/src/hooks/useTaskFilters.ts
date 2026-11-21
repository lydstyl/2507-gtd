import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const ALL_STATUSES = ['brouillon', 'pour_ia', 'collecte', 'pret', 'un_jour_peut_etre', 'termine_par_ia', 'completed']
const DEFAULT_STATUS_FILTERS = ['brouillon', 'pour_ia', 'collecte', 'pret', 'termine_par_ia']

// Catégories de date (mutuellement exclusives, couvrent toutes les tâches).
// Checkbox "afficher / masquer" comme pour les statuts.
export const DATE_CATEGORIES = ['overdue', 'today', 'tomorrow', 'this-week', 'future', 'no-date']
const DEFAULT_DATE_FILTERS: string[] = [...DATE_CATEGORIES]

// Persistance des filtres : localStorage (machine locale) + URL (partageable).
// L'URL prime : une URL partagée applique ses filtres sur n'importe quelle machine.
const STORAGE_KEY = 'gtd-task-filters'

// Seuils relatifs des filtres « Création » / « Dernière modification ».
// lt-* = « moins de » (tâches récentes), sans préfixe = « plus de » (tâches anciennes).
const RELATIVE_THRESHOLDS_MS: Record<string, number> = {
  'lt-5-min': 5 * 60 * 1000,
  'lt-1-hour': 60 * 60 * 1000,
  'lt-5-hours': 5 * 60 * 60 * 1000,
  'lt-1-day': 24 * 60 * 60 * 1000,
  'lt-2-days': 2 * 24 * 60 * 60 * 1000,
  'lt-1-week': 7 * 24 * 60 * 60 * 1000,
  '1-month': 30 * 24 * 60 * 60 * 1000,
  '3-months': 90 * 24 * 60 * 60 * 1000,
  '6-months': 180 * 24 * 60 * 60 * 1000,
}

function matchesRelativeFilter(value: string, isoDate: string | null | undefined): boolean {
  if (!value) return true
  if (!isoDate) return false
  const age = Date.now() - new Date(isoDate).getTime()
  const threshold = RELATIVE_THRESHOLDS_MS[value]
  if (threshold === undefined) return true
  return value.startsWith('lt-') ? age < threshold : age >= threshold
}

const URL_KEYS = ['q', 'imp', 'impt', 'cx', 'cxt', 'tag', 'dates', 'upd', 'crat', 'st']

// 'none' = liste vide volontaire (partageable), absent = valeur par défaut.
function parseFiltersFromUrl(params: URLSearchParams): FilterState | null {
  if (!URL_KEYS.some((k) => params.has(k))) return null
  const get = (k: string) => params.get(k) ?? ''
  const dateRaw = get('dates')
  const statusRaw = get('st')
  return {
    searchTerm: get('q'),
    importanceFilter: get('imp') === '' ? '' : Number(get('imp')),
    importanceFilterType: get('impt') === 'exact' ? 'exact' : 'gte',
    complexityFilter: get('cx') === '' ? '' : Number(get('cx')),
    complexityFilterType: get('cxt') === 'exact' ? 'exact' : 'gte',
    tagFilter: get('tag'),
    dateFilters:
      dateRaw === ''
        ? DEFAULT_DATE_FILTERS
        : dateRaw === 'none'
          ? []
          : dateRaw
              .split(',')
              .filter((c) => DATE_CATEGORIES.includes(c)),
    updatedAtFilter: get('upd'),
    createdAtFilter: get('crat'),
    statusFilters:
      statusRaw === ''
        ? DEFAULT_STATUS_FILTERS
        : statusRaw === 'none'
          ? []
          : statusRaw.split(',').filter((s) => ALL_STATUSES.includes(s)),
  }
}

function buildUrlParams(f: FilterState): Record<string, string> {
  const p: Record<string, string> = {}
  if (f.searchTerm) p.q = f.searchTerm
  if (f.importanceFilter !== '') {
    p.imp = String(f.importanceFilter)
    if (f.importanceFilterType !== 'gte') p.impt = f.importanceFilterType
  }
  if (f.complexityFilter !== '') {
    p.cx = String(f.complexityFilter)
    if (f.complexityFilterType !== 'gte') p.cxt = f.complexityFilterType
  }
  if (f.tagFilter) p.tag = f.tagFilter
  const datesAreDefault =
    f.dateFilters.length === DATE_CATEGORIES.length &&
    DATE_CATEGORIES.every((c) => f.dateFilters.includes(c))
  if (!datesAreDefault) {
    p.dates = f.dateFilters.length ? f.dateFilters.join(',') : 'none'
  }
  if (f.updatedAtFilter) p.upd = f.updatedAtFilter
  if (f.createdAtFilter) p.crat = f.createdAtFilter
  const statusesAreDefault =
    f.statusFilters.length === DEFAULT_STATUS_FILTERS.length &&
    DEFAULT_STATUS_FILTERS.every((s) => f.statusFilters.includes(s))
  if (!statusesAreDefault) {
    p.st = f.statusFilters.length ? f.statusFilters.join(',') : 'none'
  }
  return p
}

const DEFAULT_FILTERS: FilterState = {
  searchTerm: '',
  importanceFilter: '',
  importanceFilterType: 'gte',
  complexityFilter: '',
  complexityFilterType: 'gte',
  tagFilter: '',
  dateFilters: DEFAULT_DATE_FILTERS,
  updatedAtFilter: '',
  createdAtFilter: '',
  statusFilters: DEFAULT_STATUS_FILTERS,
}

function loadSavedFilters(): FilterState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_FILTERS }
    const parsed = JSON.parse(raw) as Partial<FilterState>
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
      dateFilters: Array.isArray(parsed.dateFilters)
        ? parsed.dateFilters
        : DEFAULT_DATE_FILTERS,
      statusFilters: Array.isArray(parsed.statusFilters)
        ? parsed.statusFilters
        : DEFAULT_STATUS_FILTERS,
    }
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

export function useTaskFilters(tasks: Task[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  // État initial : l'URL prime (filtres partagés), sinon localStorage, sinon défauts.
  const [initial] = useState<FilterState>(
    () => parseFiltersFromUrl(searchParams) ?? loadSavedFilters()
  )

  const [searchTerm, setSearchTerm] = useState(initial.searchTerm)
  const [importanceFilter, setImportanceFilter] = useState<number | ''>(
    initial.importanceFilter
  )
  const [importanceFilterType, setImportanceFilterType] = useState<
    'exact' | 'gte'
  >(initial.importanceFilterType)
  const [complexityFilter, setComplexityFilter] = useState<number | ''>(
    initial.complexityFilter
  )
  const [complexityFilterType, setComplexityFilterType] = useState<
    'exact' | 'gte'
  >(initial.complexityFilterType)
  const [tagFilter, setTagFilter] = useState<string>(initial.tagFilter)
  const [dateFilters, setDateFilters] = useState<string[]>(initial.dateFilters)
  const [updatedAtFilter, setUpdatedAtFilter] = useState<string>(
    initial.updatedAtFilter
  )
  const [createdAtFilter, setCreatedAtFilter] = useState<string>(
    initial.createdAtFilter
  )
  const [statusFilters, setStatusFilters] = useState<string[]>(
    initial.statusFilters
  )

  // Re-sauvegarde à chaque changement : localStorage + URL (remplace, pas d'historique pollué).
  useEffect(() => {
    const state: FilterState = {
      searchTerm,
      importanceFilter,
      importanceFilterType,
      complexityFilter,
      complexityFilterType,
      tagFilter,
      dateFilters,
      updatedAtFilter,
      createdAtFilter,
      statusFilters,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // stockage indisponible (SSR, quota) : on ignore
    }
    try {
      setSearchParams(buildUrlParams(state), { replace: true })
    } catch {
      // URL non disponible (SSR) : on ignore
    }
  }, [
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
  ])

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
      filtered = filtered.filter((task) =>
        matchesRelativeFilter(updatedAtFilter, task.updatedAt)
      )
    }

    // Created at filter
    if (createdAtFilter) {
      filtered = filtered.filter((task) =>
        matchesRelativeFilter(createdAtFilter, task.createdAt)
      )
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
