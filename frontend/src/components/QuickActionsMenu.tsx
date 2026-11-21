import type { Task, Tag } from '../types/task'

interface QuickActionsMenuProps {
  task: Task
  showSubtasks: boolean
  onMarkCompleted?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onPin?: (taskId: string) => void
  isPinned?: boolean
  onQuickAction?: (taskId: string, action: string) => void
  tags?: Tag[]
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
  tags = [],
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
              task.hasNote
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
            <span>{task.hasNote ? 'Note' : 'Ajouter note'}</span>
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

        {/* Importance / Complexité (clavier I/C = boutons) */}
        {onQuickAction && (
          <>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'importance-up'))}
              className='px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 flex items-center justify-center space-x-1'
              title="Importance +10 (clavier I)"
            >
              <span>Importance +10</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'importance-down'))}
              className='px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 flex items-center justify-center space-x-1'
              title="Importance -10 (clavier Shift+I)"
            >
              <span>Importance -10</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'complexity-up'))}
              className='px-3 py-2 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200 flex items-center justify-center space-x-1'
              title="Complexité +2 (clavier C)"
            >
              <span>Complexité +2</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'complexity-down'))}
              className='px-3 py-2 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200 flex items-center justify-center space-x-1'
              title="Complexité -2 (clavier Shift+C)"
            >
              <span>Complexité -2</span>
            </button>

            {/* Dates (clavier T/D/W/M/E = boutons) */}
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-today'))}
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
              title="Date prévue = aujourd'hui (clavier T)"
            >
              <span>Aujourd'hui</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-tomorrow'))}
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
              title="Date prévue +1 jour (clavier D)"
            >
              <span>+1 jour</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-yesterday'))}
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
              title="Date prévue -1 jour (clavier Shift+D)"
            >
              <span>-1 jour</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-week'))}
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
              title="Date prévue +1 semaine (clavier W)"
            >
              <span>+1 semaine</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-month'))}
              className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center justify-center space-x-1'
              title="Date prévue +1 mois (clavier M)"
            >
              <span>+1 mois</span>
            </button>
            <button
              onClick={() => handleAction(() => onQuickAction(task.id, 'date-remove'))}
              className='px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center space-x-1'
              title="Enlever la date prévue (clavier E)"
            >
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
              <span>Supprimer</span>
            </button>
          </>
        )}

        {/* Tags (clavier 1-9 = boutons) */}
        {onQuickAction && tags.length > 0 && (
          <div className='col-span-2 mt-1'>
            <div className='text-xs text-gray-500 mb-1'>
              Tags (clavier 1-9)
            </div>
            <div className='flex flex-wrap gap-1'>
              {tags.slice(0, 9).map((tag, idx) => {
                const active = task.tags.some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleAction(() => onQuickAction(task.id, 'tag:' + tag.id))}
                    className={`px-2 py-1 text-xs rounded border flex items-center space-x-1 ${
                      active
                        ? 'border-transparent text-white'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    style={active ? { backgroundColor: tag.color || '#6b7280' } : undefined}
                    title={`Toggle tag « ${tag.name} » (clavier ${idx + 1})`}
                  >
                    <span className='font-mono font-bold'>{idx + 1}.</span>
                    <span>{tag.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
