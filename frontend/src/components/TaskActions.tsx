import type { Task } from '../types/task'
import { useState } from 'react'

interface TaskActionsProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  onWorkedOn?: (taskId: string) => void
  onPin?: (taskId: string) => void
  isPinned?: boolean
  onQuickAction?: (taskId: string, action: string) => void
  setShowQuickActions?: (show: boolean) => void
  onToggleSubtasks?: () => void
  showSubtasks?: boolean
  showQuickActions?: boolean
  size?: 'small' | 'medium' | 'large'
  hideOnDesktop?: boolean
}

export function TaskActions({
  task,
  onEdit,
  onDelete,
  onCreateSubtask,
  onAssignParent,
  onEditNote,
  onMarkCompleted,
  onWorkedOn,
  onPin,
  isPinned = false,
  onQuickAction,
  setShowQuickActions,
  onToggleSubtasks,
  showSubtasks = false,
  showQuickActions = false,
  size = 'medium',
  hideOnDesktop = false
}: TaskActionsProps) {
  const [workedOnState, setWorkedOnState] = useState<'idle' | 'loading' | 'success'>('idle')

  const iconSize = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'
  const buttonSize = size === 'small' ? 'p-1.5' : 'p-2'
  const visibilityClass = hideOnDesktop ? 'hidden md:block' : ''

  const handleWorkedOnClick = async () => {
    if (!onWorkedOn || workedOnState !== 'idle') return

    setWorkedOnState('loading')
    try {
      await onWorkedOn(task.id)
      setWorkedOnState('success')
      // Reset to idle after success animation
      setTimeout(() => setWorkedOnState('idle'), 1500)
    } catch (error) {
      setWorkedOnState('idle')
    }
  }

  return (
    <div className='flex items-center flex-wrap gap-1'>

      {/* Create subtask button */}
      {onCreateSubtask && (
        <button
          onClick={() => onCreateSubtask(task.id)}
          className={`${buttonSize} text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ${visibilityClass}`}
          title='Ajouter une sous-tâche'
        >
          <svg
            className={iconSize}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 6v6m0 0v6m0-6h6m-6 0H6'
            />
          </svg>
        </button>
      )}

      {/* Note button */}
      <button
        onClick={() => onEditNote?.(task)}
        className={`${buttonSize} rounded transition-colors ${
          task.note
            ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
            : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
        }`}
        title={task.note ? 'Modifier la note' : 'Ajouter une note'}
      >
        <div className='relative'>
          <svg
            className={iconSize}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
            />
          </svg>
          {task.note && (
            <div className={`absolute -top-1 -right-1 bg-purple-600 rounded-full ${
              size === 'small' ? 'w-1 h-1' : 'w-1.5 h-1.5'
            }`}></div>
          )}
        </div>
      </button>

      {/* Assign parent button */}
      {onAssignParent && (
        <button
          onClick={() => onAssignParent(task)}
          className={`${buttonSize} text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors ${visibilityClass}`}
          title='Assigner une tâche parente'
        >
          <svg
            className={iconSize}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
            />
          </svg>
        </button>
      )}

      {/* Done/Undone button */}
      {onMarkCompleted && (
        <button
          onClick={() => onMarkCompleted(task.id)}
          className={`${buttonSize} ${
            task.isCompleted
              ? 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50'
              : 'text-green-400 hover:text-green-600 hover:bg-green-50'
          } rounded transition-colors ${visibilityClass}`}
          title={task.isCompleted ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
        >
          <svg
            className={iconSize}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            {task.isCompleted ? (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            ) : (
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            )}
          </svg>
        </button>
      )}

      {/* Worked on button - only show for incomplete tasks */}
      {onWorkedOn && !task.isCompleted && (
        <button
          onClick={handleWorkedOnClick}
          disabled={workedOnState !== 'idle'}
          className={`${buttonSize} rounded transition-all duration-300 ${visibilityClass} ${
            workedOnState === 'idle'
              ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50'
              : workedOnState === 'loading'
              ? 'text-orange-500 bg-orange-100 animate-pulse'
              : 'text-green-500 bg-green-100 animate-bounce'
          } ${workedOnState === 'success' ? 'scale-110' : 'scale-100'}`}
          title={
            workedOnState === 'idle'
              ? "J'ai travaillé dessus"
              : workedOnState === 'loading'
              ? 'Création en cours...'
              : 'Tâche ajoutée aux statistiques!'
          }
        >
          {workedOnState === 'loading' ? (
            <svg
              className={`${iconSize} animate-spin`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          ) : workedOnState === 'success' ? (
            <svg
              className={iconSize}
              fill='currentColor'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          ) : (
            <svg
              className={iconSize}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
              />
            </svg>
          )}
        </button>
      )}

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={() => onEdit(task)}
          className={`${buttonSize} text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors`}
          title='Modifier la tâche'
        >
          <svg
            className={iconSize}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
            />
          </svg>
        </button>
      )}

      {/* Pin button */}
      {onPin && (
        <button
          onClick={() => onPin(task.id)}
          className={`${buttonSize} rounded transition-colors ${
            isPinned
              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
              : 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50'
          }`}
          title={isPinned ? 'Désépingler la tâche' : 'Épingler la tâche en haut'}
        >
          <svg
            className={iconSize}
            fill={isPinned ? 'currentColor' : 'none'}
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
            />
          </svg>
        </button>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={() => {
            if (window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.name}" ? Cette action est irréversible.`)) {
              onDelete(task.id)
            }
          }}
          className={`${buttonSize} text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${visibilityClass}`}
          title='Supprimer la tâche'
        >
          <svg
            className={iconSize}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
            />
          </svg>
        </button>
      )}

      {/* Mobile quick actions button */}
      {onQuickAction && setShowQuickActions && (
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`p-2 rounded transition-colors md:hidden ${
            showQuickActions
              ? 'text-blue-600 bg-blue-100 hover:text-blue-800 hover:bg-blue-200'
              : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title='Actions rapides'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 10V3L4 14h7v7l9-11h-7z'
            />
          </svg>
        </button>
      )}
    </div>
  )
}