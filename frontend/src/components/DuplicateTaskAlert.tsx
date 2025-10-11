import type { Task } from '../types/task'

interface DuplicateTaskAlertProps {
  matches: Array<{ task: Task; matchedWords: string[] }>
  maxVisible?: number
  compact?: boolean
}

/**
 * Reusable component to display duplicate task warnings
 * @param matches - Array of tasks with matched words
 * @param maxVisible - Maximum number of tasks to display (default: 5)
 * @param compact - Use compact styling for smaller displays (default: false)
 */
export function DuplicateTaskAlert({
  matches,
  maxVisible = 5,
  compact = false
}: DuplicateTaskAlertProps) {
  if (matches.length === 0) {
    return null
  }

  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5'
  const textSize = compact ? 'text-xs' : 'text-sm'
  const padding = compact ? 'p-2' : 'p-3'
  const maxHeight = compact ? 'max-h-24' : 'max-h-32'

  return (
    <div className={`mt-2 ${padding} bg-yellow-50 border border-yellow-200 rounded-md`}>
      <div className="flex items-start">
        <svg
          className={`${iconSize} text-yellow-600 mt-0.5 mr-2 flex-shrink-0`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className={`${textSize} font-medium text-yellow-800 mb-1`}>
            Tâches similaires détectées
          </p>
          <div className={`${textSize} text-yellow-700 space-y-1 ${maxHeight} overflow-y-auto`}>
            {matches.slice(0, maxVisible).map(({ task, matchedWords }) => (
              <div key={task.id} className="flex items-start">
                <span className="mr-1">•</span>
                <div>
                  <span className="font-medium">{task.name}</span>
                  <span className="text-xs text-yellow-600 ml-1">
                    ({matchedWords.join(', ')})
                  </span>
                </div>
              </div>
            ))}
            {matches.length > maxVisible && (
              <p className="text-xs text-yellow-600 italic">
                ... et {matches.length - maxVisible} autre(s) tâche(s)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
