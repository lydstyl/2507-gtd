import type { Task } from '../types/task'
import { TaskActions } from './TaskActions'
import { getPriorityColor, formatDate, isOverdue, isDueDateUrgent } from '../utils/taskUtils'

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
  level = 1
}: SubTaskCardProps) {
  const bgColor = level === 1 ? 'bg-gray-50' : 'bg-gray-100'
  const borderColor = level === 1 ? 'border-gray-200' : 'border-gray-300'
  const padding = level === 1 ? 'p-2' : 'p-1.5'
  const textSize = level === 1 ? 'text-sm' : 'text-xs'
  const actionSize = level === 1 ? 'medium' : 'small'

  return (
    <div
      className={`${bgColor} rounded-md ${padding} border ${borderColor}`}
      onClick={() => onSelectTask?.(task.id)}
    >
      <div className='flex items-center space-x-2'>
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
          className={`${level === 1 ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full ${getPriorityColor(
            task.importance
          )}`}
        ></div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between'>
            <h5 className={`${textSize} font-medium text-gray-900 break-words flex-1 mr-2 ${
              task.isCompleted ? 'line-through text-gray-600' : ''
            }`}>
              {task.name}
            </h5>
            <div className='flex items-center space-x-1 flex-shrink-0'>
              {task.plannedDate && (
                <span
                  className={`text-xs font-medium ${
                    isOverdue(task.plannedDate) ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {formatDate(task.plannedDate)}
                </span>
              )}
              {task.dueDate && (
                <span className={`text-xs font-medium ${
                  isDueDateUrgent(task.dueDate) ? 'text-red-600' : 'text-blue-600'
                }`}>
                  📅 {formatDate(task.dueDate)}
                </span>
              )}

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
          <p className={`${level === 1 ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
            I: {task.importance} | C: {task.complexity} | P: {task.points}
          </p>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1`}>
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
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}