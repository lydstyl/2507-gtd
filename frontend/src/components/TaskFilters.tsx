import React from 'react'
import type { Tag } from '../types/task'
import { TASK_STATUS_LABELS, type TaskStatus } from '../types/task'

const STATUS_OPTIONS: { key: string; label: string }[] = [
  ...(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([key, label]) => ({ key, label })),
  { key: 'completed', label: 'Complétée' }
]

const DATE_OPTIONS: { key: string; label: string }[] = [
  { key: 'overdue', label: 'En retard' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'this-week', label: 'Cette semaine' },
  { key: 'future', label: 'Plus loin' },
  { key: 'no-date', label: 'Sans date' }
]

// Options relatives courtes pour « Création » / « Dernière modification ».
const SHORT_RELATIVE_OPTIONS: { key: string; label: string }[] = [
  { key: 'lt-5-min', label: 'Moins de 5 minutes' },
  { key: 'lt-1-hour', label: "Moins d'une heure" },
  { key: 'lt-5-hours', label: 'Moins de 5 heures' },
  { key: 'lt-1-day', label: "Moins d'un jour" },
  { key: 'lt-2-days', label: 'Moins de 2 jours' },
  { key: 'lt-1-week', label: "Moins d'une semaine" }
]

const LONG_RELATIVE_OPTIONS: { key: string; label: string }[] = [
  { key: '1-month', label: 'Plus de 1 mois' },
  { key: '3-months', label: 'Plus de 3 mois' },
  { key: '6-months', label: 'Plus de 6 mois' }
]

interface TaskFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  importanceFilter: number | ''
  setImportanceFilter: (value: number | '') => void
  importanceFilterType: 'exact' | 'gte'
  setImportanceFilterType: (type: 'exact' | 'gte') => void
  complexityFilter: number | ''
  setComplexityFilter: (value: number | '') => void
  complexityFilterType: 'exact' | 'gte'
  setComplexityFilterType: (type: 'exact' | 'gte') => void
  tagFilter: string
  setTagFilter: (tagId: string) => void
  dateFilters: string[]
  toggleDateFilter: (category: string) => void
  updatedAtFilter: string
  setUpdatedAtFilter: (filter: string) => void
  createdAtFilter: string
  setCreatedAtFilter: (filter: string) => void
  statusFilters: string[]
  toggleStatusFilter: (status: string) => void
  tags: Tag[]
  clearAllFilters: () => void
  hasActiveFilters: boolean
  filteredTasksCount: number
  totalTasksCount: number
  showFilters: boolean
  setShowFilters: (show: boolean | ((prev: boolean) => boolean)) => void
}

export function TaskFilters({
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
  tags,
  clearAllFilters,
  hasActiveFilters,
  filteredTasksCount,
  totalTasksCount,
  showFilters,
  setShowFilters
}: TaskFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <>
      <div className='flex items-center justify-between mb-2'>
        <button
          className='text-xs text-gray-700 underline'
          title='Raccourci clavier : S'
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? 'Cacher les filtres' : 'Afficher les filtres'}{' '}
          <kbd className='font-mono text-[10px] bg-gray-100 border border-gray-300 rounded px-1'>S</kbd>
        </button>
        {/* Compteur de résultats toujours visible (hors panneau replié) */}
        {(hasActiveFilters || filteredTasksCount !== totalTasksCount) && (
          <span className='text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 whitespace-nowrap'>
            {filteredTasksCount} tâche{filteredTasksCount !== 1 ? 's' : ''}
            {filteredTasksCount !== totalTasksCount && ` / ${totalTasksCount}`}
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className='mb-6'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Rechercher une tâche...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <svg
              className='h-5 w-5 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
              type='button'
            >
              <svg
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className='mb-6 bg-gray-50 p-4 rounded-lg'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-medium text-gray-700'>Filtres</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className='text-sm text-blue-600 hover:text-blue-800 underline'
              >
                Effacer tous les filtres
              </button>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Importance filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Importance (100-499)
              </label>
              <div className='flex space-x-2'>
                <select
                  value={importanceFilterType}
                  onChange={(e) =>
                    setImportanceFilterType(e.target.value as 'exact' | 'gte')
                  }
                  className='w-1/3 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs'
                >
                  <option value='gte'>≥</option>
                  <option value='exact'>=</option>
                </select>
                <select
                  value={importanceFilter}
                  onChange={(e) =>
                    setImportanceFilter(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className='w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                >
                  <option value=''>Toutes</option>
                  <option value='400'>🔥 Importante + Urgente (400)</option>
                  <option value='300'>📌 Importante (300)</option>
                  <option value='200'>⚡ Urgente (200)</option>
                  <option value='100'>🐢 Basique (100)</option>
                </select>
              </div>
            </div>

            {/* Complexity filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Complexité (1-9)
              </label>
              <div className='flex space-x-2'>
                <select
                  value={complexityFilterType}
                  onChange={(e) =>
                    setComplexityFilterType(e.target.value as 'exact' | 'gte')
                  }
                  className='w-1/3 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs'
                >
                  <option value='gte'>≤</option>
                  <option value='exact'>=</option>
                </select>
                <select
                  value={complexityFilter}
                  onChange={(e) =>
                    setComplexityFilter(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  className='w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                >
                  <option value=''>Toutes</option>
                  <option value='1'>Simple (1)</option>
                  <option value='3'>Facile (3)</option>
                  <option value='5'>Moyenne (5)</option>
                  <option value='7'>Difficile (7)</option>
                  <option value='9'>Très complexe (9)</option>
                </select>
              </div>
            </div>

            {/* Tag filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Tag
              </label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
              >
                <option value=''>Tous les tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status filter */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Statut
            </label>
            <div className='flex flex-wrap gap-3'>
              {STATUS_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className='flex items-center space-x-1.5 cursor-pointer select-none'
                >
                  <input
                    type='checkbox'
                    checked={statusFilters.includes(key)}
                    onChange={() => toggleStatusFilter(key)}
                    className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700'>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date filter (afficher / masquer) */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date (afficher / masquer)
            </label>
            <div className='flex flex-wrap gap-3'>
              {DATE_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className='flex items-center space-x-1.5 cursor-pointer select-none'
                >
                  <input
                    type='checkbox'
                    checked={dateFilters.includes(key)}
                    onChange={() => toggleDateFilter(key)}
                    className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700'>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Updated at filter */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Dernière modification
            </label>
            <select
              value={updatedAtFilter}
              onChange={(e) => setUpdatedAtFilter(e.target.value)}
              className='w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Toutes</option>
              {SHORT_RELATIVE_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              {LONG_RELATIVE_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Created at filter */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Date de création
            </label>
            <select
              value={createdAtFilter}
              onChange={(e) => setCreatedAtFilter(e.target.value)}
              className='w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Toutes</option>
              {SHORT_RELATIVE_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              {LONG_RELATIVE_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  )
}
