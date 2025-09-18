import type { Task } from '../types/task'

interface QuickActionsMenuProps {
  task: Task
  showSubtasks: boolean
  onMarkCompleted?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onPin?: (taskId: string) => void
  isPinned?: boolean
  onQuickAction?: (taskId: string, action: string) => void
  onToggleSubtasks: () => void
  onClose: () => void
}

export function QuickActionsMenu({
  task,
  showSubtasks,
  onMarkCompleted,
  onCreateSubtask,
  onAssignParent,
  onPin,
  isPinned = false,
  onQuickAction,
  onToggleSubtasks,
  onClose
}: QuickActionsMenuProps) {
  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div className='absolute top-full left-0 right-0 z-50 border border-gray-200 rounded-b-lg p-4 bg-white shadow-lg'>
      <div className='text-sm font-medium text-gray-700 mb-3'>Actions rapides</div>
      <div className='grid grid-cols-2 gap-2'>
        {/* Task completion */}
        {onMarkCompleted && !task.isCompleted && (
          <button
            onClick={() => handleAction(() => onMarkCompleted(task.id))}
            className='px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center space-x-1'
          >
            <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
            <span>Terminer</span>
          </button>
        )}

        {/* Create subtask */}
        {onCreateSubtask && (
          <button
            onClick={() => handleAction(() => onCreateSubtask(task.id))}
            className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center space-x-1'
          >
            <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
            </svg>
            <span>Sous-tâche</span>
          </button>
        )}

        {/* Assign parent */}
        {onAssignParent && (
          <button
            onClick={() => handleAction(() => onAssignParent(task))}
            className='px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center space-x-1'
          >
            <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
            </svg>
            <span>Parent</span>
          </button>
        )}

        {/* Pin/Unpin */}
        {onPin && (
          <button
            onClick={() => handleAction(() => onPin(task.id))}
            className={`px-3 py-2 text-xs rounded hover:bg-opacity-80 flex items-center justify-center space-x-1 ${
              isPinned
                ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            <svg className='w-3 h-3' fill={isPinned ? 'currentColor' : 'none'} stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
            </svg>
            <span>{isPinned ? 'Désépingler' : 'Épingler'}</span>
          </button>
        )}

        {/* Toggle subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <button
            onClick={() => handleAction(onToggleSubtasks)}
            className='px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center justify-center space-x-1'
          >
            <svg className={`w-3 h-3 transition-transform ${showSubtasks ? 'rotate-90' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span>{showSubtasks ? 'Masquer' : 'Afficher'} sous-tâches</span>
          </button>
        )}

        {/* Quick property edits */}
        {onQuickAction && (
          <>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'importance-up'))}
              className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
            >
              ↑ Importance
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'importance-down'))}
              className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
            >
              ↓ Importance
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'complexity-up'))}
              className='px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200'
            >
              ↑ Complexité
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'complexity-down'))}
              className='px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200'
            >
              ↓ Complexité
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-today'))}
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200'
            >
              Date aujourd'hui
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-remove'))}
              className='px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
            >
              Enlever date
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'delete'))}
              className='px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center space-x-1'
            >
              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
              </svg>
              <span>Supprimer</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}