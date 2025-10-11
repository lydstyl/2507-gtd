import { useState, useRef, useEffect, useMemo } from 'react'
import { api } from '../utils/api'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import type { Task } from '../types/task'

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
  const [tasks, setTasks] = useState<Task[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const haptic = useHapticFeedback()

  // Load tasks when visible
  useEffect(() => {
    if (isVisible) {
      loadTasks()
    }
  }, [isVisible])

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

  const loadTasks = async () => {
    try {
      const tasksData = await api.getTasks()
      setTasks(tasksData)
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err)
    }
  }

  // Detect duplicate words in real-time
  const duplicateWordMatches = useMemo(() => {
    if (!taskName || taskName.trim().length < 3) {
      return []
    }

    // Extract words from current task name (more than 3 letters, ignore common words)
    const commonWords = new Set(['the', 'and', 'for', 'with', 'une', 'des', 'les', 'dans', 'pour', 'sur'])
    const currentWords = taskName
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word))

    if (currentWords.length === 0) {
      return []
    }

    // Find tasks that contain any of these words (exclude completed tasks)
    const matches: Array<{ task: Task; matchedWords: string[] }> = []

    tasks.forEach((task) => {
      // Skip completed tasks
      if (task.completedAt) return

      const taskWords = task.name.toLowerCase().split(/\s+/)
      const matchedWords = currentWords.filter((word) =>
        taskWords.some((taskWord) => taskWord.includes(word))
      )

      if (matchedWords.length > 0) {
        matches.push({ task, matchedWords })
      }
    })

    return matches
  }, [taskName, tasks])

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

          {/* Duplicate word alert */}
          {duplicateWordMatches.length > 0 && (
            <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md'>
              <div className='flex items-start'>
                <svg className='w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                </svg>
                <div className='flex-1'>
                  <p className='text-xs font-medium text-yellow-800 mb-1'>
                    Tâches similaires détectées
                  </p>
                  <div className='text-xs text-yellow-700 space-y-1 max-h-24 overflow-y-auto'>
                    {duplicateWordMatches.slice(0, 3).map(({ task, matchedWords }) => (
                      <div key={task.id} className='flex items-start'>
                        <span className='mr-1'>•</span>
                        <div>
                          <span className='font-medium'>{task.name}</span>
                          <span className='text-xs text-yellow-600 ml-1'>
                            ({matchedWords.join(', ')})
                          </span>
                        </div>
                      </div>
                    ))}
                    {duplicateWordMatches.length > 3 && (
                      <p className='text-xs text-yellow-600 italic'>
                        ... et {duplicateWordMatches.length - 3} autre(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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