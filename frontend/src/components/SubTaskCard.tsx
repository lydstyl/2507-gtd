import type { Task } from '../types/task'
import { TaskActions } from './TaskActions'
import { getPriorityColor, formatDate, isOverdue, isDueDateUrgent } from '../utils/taskUtils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SubTaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  onWorkedOn?: (taskId: string) => void
  onSelectTask?: (taskId: string) => void
  onQuickAction?: (taskId: string, action: string) => void
  level?: number
  isDraggable?: boolean
}

export function SubTaskCard({
  task,
  onEdit,
  onDelete,
  onCreateSubtask,
  onAssignParent,
  onEditNote,
  onMarkCompleted,
  onWorkedOn,
  onSelectTask,
  onQuickAction,
  level = 1,
  isDraggable = true
}: SubTaskCardProps) {
  const bgColor = level === 1 ? 'bg-gray-50' : 'bg-gray-100'
  const borderColor = level === 1 ? 'border-gray-200' : 'border-gray-300'
  const padding = level === 1 ? 'p-2' : 'p-1.5'
  const textSize = level === 1 ? 'text-sm' : 'text-xs'
  const actionSize = level === 1 ? 'medium' : 'small'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    disabled: !isDraggable
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${bgColor} rounded-md ${padding} border ${borderColor} hover:bg-gray-50 transition-colors ${
        isDragging ? 'z-50 shadow-lg' : ''
      }`}
      onClick={() => onSelectTask?.(task.id)}
    >
      <div className='flex flex-col space-y-2'>
        {/* Row 1: Drag handle, Checkbox, priority dot, name and link */}
        <div className='flex items-center space-x-2'>
          {/* Drag handle */}
          {isDraggable && (
            <div
              {...attributes}
              {...listeners}
              className='cursor-move flex-shrink-0 text-gray-400 hover:text-gray-600 touch-none'
              title='Glisser pour réorganiser'
            >
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z'></path>
              </svg>
            </div>
          )}
          {/* Mobile-first completion checkbox for subtasks */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkCompleted?.(task.id)
            }}
            className={`flex-shrink-0 ${level === 1 ? 'w-6 h-6' : 'w-5 h-5'} rounded border-2 flex items-center justify-center transition-all duration-200 ${
              task.isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title={task.isCompleted ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
          >
            {task.isCompleted && (
              <svg className={`${level === 1 ? 'w-4 h-4' : 'w-3 h-3'}`} fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </button>
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(
              task.importance
            )}`}
          ></div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2'>
              <h5 className={`${textSize} font-medium text-gray-900 break-words flex-1 ${
                task.isCompleted ? 'line-through text-gray-600' : ''
              }`}>
                {task.name}
              </h5>
              {task.link && (
                <a
                  href={task.link}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-800 flex items-center space-x-1 flex-shrink-0'
                  title='Ouvrir le lien'
                  onClick={(e) => e.stopPropagation()}
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
                      d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                    />
                  </svg>
                  <span className='text-xs font-medium'>Lien</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: I C P values and compact dates */}
        <div className='flex items-center justify-between'>
          <p className={`${level === 1 ? 'text-xs' : 'text-xs'} text-gray-500 font-medium`}>
            I: {task.importance} | C: {task.complexity} | P: {task.points}
          </p>

          {/* Compact dates display */}
          <div className='flex items-center space-x-2'>
            {task.plannedDate && (
              <span
                className={`text-xs font-medium ${
                  isOverdue(task.plannedDate) ? 'text-red-600' : 'text-gray-600'
                }`}
                title={isOverdue(task.plannedDate) ? 'En retard' : 'Date prévue'}
              >
                {formatDate(task.plannedDate)}
              </span>
            )}
            {task.dueDate && (
              <span className={`text-xs font-medium ${
                isDueDateUrgent(task.dueDate) ? 'text-red-600' : 'text-blue-600'
              }`} title={isDueDateUrgent(task.dueDate) ? 'Date limite urgente!' : 'Date limite'}>
                📅 {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Tags and Actions */}
        <div className='flex items-center justify-between'>
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className={`flex flex-wrap gap-1`}>
              {task.tags.map((tag) => (
                level === 1 ? (
                  <span
                    key={tag.id}
                    className='inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium'
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    <span
                      className='w-2 h-2 rounded-full mr-1'
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    {tag.name}
                  </span>
                ) : (
                  <span
                    key={tag.id}
                    className='inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium'
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    <span
                      className='w-1.5 h-1.5 rounded-full mr-0.5'
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    {tag.name}
                  </span>
                )
              ))}
            </div>
          )}

          {/* Actions */}
          <div className='ml-auto'>
            <TaskActions
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubtask={onCreateSubtask}
              onAssignParent={onAssignParent}
              onEditNote={onEditNote}
              onMarkCompleted={onMarkCompleted}
              onWorkedOn={onWorkedOn}
              onQuickAction={onQuickAction}
              size={actionSize}
            />
          </div>
        </div>

        {/* Nested subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className='mt-2 pt-2 border-t border-gray-200'>
            <div className='text-xs text-gray-500 mb-1 font-medium'>
              {level === 1 ? 'Sous-sous-tâches' : 'Sous-tâches'} ({task.subtasks.length})
            </div>
            <div className='space-y-1'>
              {task.subtasks.map((subtask) => (
                <SubTaskCard
                  key={subtask.id}
                  task={subtask}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCreateSubtask={onCreateSubtask}
                  onAssignParent={onAssignParent}
                  onEditNote={onEditNote}
                  onMarkCompleted={onMarkCompleted}
                  onSelectTask={onSelectTask}
                  onQuickAction={onQuickAction}
                  level={level + 1}
                  isDraggable={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}