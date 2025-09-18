import type { Task } from '../types/task'

interface TaskActionsProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  onPin?: (taskId: string) => void
  isPinned?: boolean
  onQuickAction?: (taskId: string, action: string) => void
  setShowQuickActions?: (show: boolean) => void
  onToggleSubtasks?: () => void
  showSubtasks?: boolean
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
  onPin,
  isPinned = false,
  onQuickAction,
  setShowQuickActions,
  onToggleSubtasks,
  showSubtasks = false,
  size = 'medium',
  hideOnDesktop = false
}: TaskActionsProps) {
  const iconSize = size === 'small' ? 'w-2.5 h-2.5' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'
  const buttonSize = size === 'small' ? 'p-0.5' : 'p-1'
  const visibilityClass = hideOnDesktop ? 'hidden md:block' : ''

  return (
    <div className='flex items-center space-x-1'>
      {/* Toggle subtasks button */}
      {task.subtasks && task.subtasks.length > 0 && onToggleSubtasks && (
        <button
          onClick={onToggleSubtasks}
          className={`${buttonSize} text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors ${visibilityClass}`}
          title={showSubtasks ? 'Masquer les sous-tâches' : 'Afficher les sous-tâches'}
        >
          <svg
            className={`${iconSize} transition-transform ${showSubtasks ? 'rotate-90' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5l7 7-7 7'
            />
          </svg>
        </button>
      )}

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

      {/* Done button */}
      {onMarkCompleted && !task.isCompleted && (
        <button
          onClick={() => onMarkCompleted(task.id)}
          className={`${buttonSize} text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors ${visibilityClass}`}
          title='Marquer comme terminé'
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
              d='M5 13l4 4L19 7'
            />
          </svg>
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
          onClick={() => onDelete(task.id)}
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
          onClick={() => setShowQuickActions(true)}
          className='p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors md:hidden'
          title='Actions rapides'
        >
          <svg
            className='w-3 h-3'
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