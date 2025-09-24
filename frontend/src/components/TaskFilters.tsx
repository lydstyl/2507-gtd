import React from 'react'
import type { Tag } from '../types/task'

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
  dateFilter: string
  setDateFilter: (filter: string) => void
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
  dateFilter,
  setDateFilter,
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
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? 'Cacher les filtres' : 'Afficher les filtres'}
        </button>
      </div>

      {/* Search bar */}
      <div className='mb-6'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Rechercher une tâche...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                Importance (0-50)
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
                  <option value='50'>Très élevée (50)</option>
                  <option value='40'>Élevée (40)</option>
                  <option value='30'>Moyenne (30)</option>
                  <option value='20'>Basse (20)</option>
                  <option value='10'>Très basse (10)</option>
                  <option value='0'>Nulle (0)</option>
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

          {/* Date filter */}
          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Date prévue
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className='w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            >
              <option value=''>Toutes les dates</option>
              <option value='overdue'>En retard</option>
              <option value='today'>Aujourd'hui</option>
              <option value='tomorrow'>Demain</option>
              <option value='this-week'>Cette semaine</option>
              <option value='future'>Plus tard</option>
              <option value='no-date'>Sans date</option>
            </select>
          </div>

          {/* Results counter */}
          {(hasActiveFilters || filteredTasksCount !== totalTasksCount) && (
            <div className='mt-4 text-sm text-gray-600'>
              {filteredTasksCount} tâche{filteredTasksCount !== 1 ? 's' : ''}{' '}
              trouvée{filteredTasksCount !== 1 ? 's' : ''}
              {filteredTasksCount !== totalTasksCount &&
                ` sur ${totalTasksCount}`}
            </div>
          )}
        </div>
      )}
    </>
  )
}
