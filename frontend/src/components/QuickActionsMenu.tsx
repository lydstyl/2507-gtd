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
  onEdit?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onWorkedOn?: (taskId: string) => void
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
  onClose,
  onEdit,
  onEditNote,
  onWorkedOn
}: QuickActionsMenuProps) {
  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div className='top-full left-0 right-0 z-50 border border-gray-200 rounded-b-lg p-4 bg-white shadow-lg'>
      <div className='text-sm font-medium text-gray-700 mb-3'>
        Actions rapides
      </div>
      <div className='grid grid-cols-2 gap-2'>
        {/* Task completion toggle */}
        {onMarkCompleted && (
          <button
            onClick={() => handleAction(() => onMarkCompleted(task.id))}
            className={`px-3 py-2 text-xs rounded hover:bg-opacity-80 flex items-center justify-center space-x-1 ${
              task.isCompleted
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <svg
              className='w-3 h-3'
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
            <span>{task.isCompleted ? 'Reprendre' : 'Terminer'}</span>
          </button>
        )}

        {/* Create subtask */}
        {onCreateSubtask && (
          <button
            onClick={() => handleAction(() => onCreateSubtask(task.id))}
            className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center space-x-1'
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
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
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
                d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
              />
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
            <svg
              className='w-3 h-3'
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
            <span>{isPinned ? 'Désépingler' : 'Épingler'}</span>
          </button>
        )}

        {/* Toggle subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <button
            onClick={() => handleAction(onToggleSubtasks)}
            className='px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center justify-center space-x-1'
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                showSubtasks ? 'rotate-90' : ''
              }`}
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
            <span>{showSubtasks ? 'Masquer' : 'Afficher'} sous-tâches</span>
          </button>
        )}

        {/* Edit note button */}
        {onEditNote && (
          <button
            onClick={() => handleAction(() => onEditNote(task))}
            className={`px-3 py-2 text-xs rounded hover:bg-opacity-80 flex items-center justify-center space-x-1 ${
              task.note
                ? 'bg-purple-200 text-purple-800 hover:bg-purple-300'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
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
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            <span>{task.note ? 'Note' : 'Ajouter note'}</span>
          </button>
        )}

        {/* Worked on button - only show for incomplete tasks */}
        {onWorkedOn && !task.isCompleted && (
          <button
            onClick={() => handleAction(() => onWorkedOn(task.id))}
            className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
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
                d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
              />
            </svg>
            <span>Travaillé dessus</span>
          </button>
        )}

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={() => handleAction(() => onEdit(task))}
            className='px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center space-x-1'
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
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            <span>Modifier</span>
          </button>
        )}

        {/* Quick date actions */}
        {onQuickAction && (
          <>
            <button
              onClick={() =>
                handleAction(() => onQuickAction(task.id, 'date-today'))
              }
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
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
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <span>Aujourd'hui</span>
            </button>
            <button
              onClick={() =>
                handleAction(() => onQuickAction(task.id, 'date-remove'))
              }
              className='px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center space-x-1'
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
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
              <span>Enlever date</span>
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Êtes-vous sûr de vouloir supprimer la tâche "${task.name}" ? Cette action est irréversible.`
                  )
                ) {
                  handleAction(() => onQuickAction(task.id, 'delete'))
                }
              }}
              className='px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center space-x-1'
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
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
              <span>Supprimer</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
