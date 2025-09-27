import { useState, useRef, useEffect } from 'react'
import { api } from '../utils/api'
import { useHapticFeedback } from '../hooks/useHapticFeedback'

interface QuickAddInputProps {
  onTaskCreated?: () => void
  onCancel?: () => void
  isVisible: boolean
  placeholder?: string
  parentId?: string
}

export function QuickAddInput({
  onTaskCreated,
  onCancel,
  isVisible,
  placeholder = "Nom de la tâche...",
  parentId
}: QuickAddInputProps) {
  const [taskName, setTaskName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [importance, setImportance] = useState(20)
  const [complexity, setComplexity] = useState(3)
  const [plannedDate, setPlannedDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const haptic = useHapticFeedback()

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      haptic.modalOpen() // Haptic feedback when quick add opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isVisible, haptic])

  // Reset form when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setTaskName('')
      setShowAdvanced(false)
      setImportance(20)
      setComplexity(3)
      setPlannedDate('')
    }
  }, [isVisible])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName.trim() || isCreating) return

    setIsCreating(true)
    try {
      const taskData = {
        name: taskName.trim(),
        importance,
        complexity,
        plannedDate: plannedDate || null,
        parentId: parentId || null
      }

      await api.createTask(taskData)
      haptic.taskCreated() // Haptic feedback for successful task creation
      setTaskName('')
      setShowAdvanced(false)
      onTaskCreated?.()
    } catch (error) {
      haptic.error() // Haptic feedback for errors
      console.error('Erreur lors de la création de la tâche:', error)
      alert('Erreur lors de la création de la tâche')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    haptic.modalClose() // Haptic feedback when closing
    setTaskName('')
    setShowAdvanced(false)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isVisible) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mx-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Task name input */}
        <div>
          <input
            ref={inputRef}
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isCreating}
          />
        </div>

        {/* Advanced options toggle */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Options avancées</span>
          </button>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            {/* Importance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importance
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: 50, label: 'Très élevée', color: 'bg-red-500' },
                  { value: 40, label: 'Élevée', color: 'bg-orange-500' },
                  { value: 30, label: 'Moyenne', color: 'bg-yellow-500' },
                  { value: 20, label: 'Basse', color: 'bg-blue-500' },
                  { value: 10, label: 'Très basse', color: 'bg-green-500' },
                  { value: 0, label: 'Nulle', color: 'bg-gray-500' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setImportance(value)}
                    className={`px-2 py-1 text-xs rounded border ${
                      importance === value
                        ? `${color} text-white border-transparent`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complexité
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: 1, label: 'Simple' },
                  { value: 3, label: 'Facile' },
                  { value: 5, label: 'Moyenne' },
                  { value: 7, label: 'Difficile' },
                  { value: 9, label: 'Très complexe' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setComplexity(value)}
                    className={`px-2 py-1 text-xs rounded border ${
                      complexity === value
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date prévue
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {showAdvanced && (
              <span>I: {importance} | C: {complexity} | P: {importance * complexity}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!taskName.trim() || isCreating}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center space-x-1"
            >
              {isCreating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}