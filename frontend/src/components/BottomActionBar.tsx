import { useState } from 'react'
import { useHapticFeedback } from '../hooks/useHapticFeedback'

interface BottomActionBarProps {
  onCreateTask?: () => void
  onToggleFilters?: () => void
  onRefreshTasks?: () => void
  onToggleShortcuts?: () => void
  onToggleQuickAdd?: () => void
  hasActiveFilters?: boolean
  isQuickAddVisible?: boolean
  isFiltersVisible?: boolean
}

export function BottomActionBar({
  onCreateTask,
  onToggleFilters,
  onRefreshTasks,
  onToggleShortcuts,
  onToggleQuickAdd,
  hasActiveFilters = false,
  isQuickAddVisible = false,
  isFiltersVisible = false
}: BottomActionBarProps) {
  const [showLabels, setShowLabels] = useState(false)
  const haptic = useHapticFeedback()

  const handleButtonPress = (action: () => void) => {
    haptic.buttonPress() // Haptic feedback for button press
    action()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2 max-w-screen-sm mx-auto">

        {/* Quick Add */}
        <button
          onClick={() => handleButtonPress(() => onToggleQuickAdd?.())}
          onTouchStart={() => setShowLabels(true)}
          onTouchEnd={() => setTimeout(() => setShowLabels(false), 1500)}
          className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isQuickAddVisible
              ? 'bg-green-100 text-green-600'
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
          title="Ajout rapide"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showLabels && <span className="text-xs font-medium">Rapide</span>}
        </button>

        {/* Filters */}
        <button
          onClick={() => handleButtonPress(() => onToggleFilters?.())}
          onTouchStart={() => setShowLabels(true)}
          onTouchEnd={() => setTimeout(() => setShowLabels(false), 1500)}
          className={`relative flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isFiltersVisible
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Filtres"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
          {showLabels && <span className="text-xs font-medium">Filtres</span>}
        </button>

        {/* New Task (Full Modal) */}
        <button
          onClick={() => handleButtonPress(() => onCreateTask?.())}
          onTouchStart={() => setShowLabels(true)}
          onTouchEnd={() => setTimeout(() => setShowLabels(false), 1500)}
          className="flex flex-col items-center px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          title="Nouvelle tâche"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {showLabels && <span className="text-xs font-medium">Nouvelle</span>}
        </button>

        {/* Refresh */}
        <button
          onClick={() => handleButtonPress(() => onRefreshTasks?.())}
          onTouchStart={() => setShowLabels(true)}
          onTouchEnd={() => setTimeout(() => setShowLabels(false), 1500)}
          className="flex flex-col items-center px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          title="Actualiser"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {showLabels && <span className="text-xs font-medium">Actualiser</span>}
        </button>

        {/* Shortcuts Help */}
        <button
          onClick={() => handleButtonPress(() => onToggleShortcuts?.())}
          onTouchStart={() => setShowLabels(true)}
          onTouchEnd={() => setTimeout(() => setShowLabels(false), 1500)}
          className="flex flex-col items-center px-3 py-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
          title="Raccourcis"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showLabels && <span className="text-xs font-medium">Aide</span>}
        </button>
      </div>
    </div>
  )
}