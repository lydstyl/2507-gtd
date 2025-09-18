import type { Task } from '../types/task'
import { Tag } from './Tag'
import { TaskActions } from './TaskActions'
import { QuickActionsMenu } from './QuickActionsMenu'
import { SubTaskCard } from './SubTaskCard'
import { getPriorityColor, formatDate, isOverdue, getDateIndicator, getTaskCategory, getTaskCategoryStyle } from '../utils/taskUtils'
import { useState } from 'react'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  onAssignParent?: (task: Task) => void
  onEditNote?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => void
  level?: number
  isEven?: boolean
  isSelected?: boolean // Ajouté pour la sélection
  onSelectTask?: (taskId: string) => void // Ajouté pour la sélection par clic
  selectedTaskId?: string // Ajouté pour la sélection profonde
  onQuickAction?: (taskId: string, action: string) => void // Ajouté pour les actions rapides
  onPin?: (taskId: string) => void // Ajouté pour épingler/désépingler la tâche
  isPinned?: boolean // Ajouté pour indiquer si la tâche est épinglée
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onCreateSubtask,
  onAssignParent,
  onEditNote,
  onMarkCompleted,
  level = 0,
  isEven = false,
  isSelected = false,
  onSelectTask,
  selectedTaskId,
  onQuickAction, // Ajouté
  onPin, // Ajouté
  isPinned = false // Ajouté
}: TaskCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  if (!task) return null;


  const indentStyle = level > 0 ? { marginLeft: `${level * 24}px` } : {}

  const selected = selectedTaskId ? selectedTaskId === task.id : isSelected

  // Get task category and styling
  const category = getTaskCategory(task)
  const categoryStyle = getTaskCategoryStyle(category)

  return (
    <div style={indentStyle}>
      <div
        data-testid={`task-card-${task.id}`}
        className={`relative border border-gray-200 rounded-lg hover:bg-gray-50 h-full border-l-4 ${
          categoryStyle.borderColor
        } ${
          task.isCompleted ? 'opacity-75 bg-green-50 border-green-200' :
          selected ? categoryStyle.backgroundColor :
          isEven ? categoryStyle.backgroundColor : categoryStyle.backgroundColor
        } ${selected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''}`}
        onClick={() => {
          if (onSelectTask) {
            onSelectTask(task.id)
            console.log('Sélection tâche (clic):', task.name)
          }
        }}
      >
        <div className='flex flex-col h-full p-4'>
          {/* Category indicator */}
          <div className={`text-xs font-medium mb-2 ${categoryStyle.textColor}`}>
            {categoryStyle.label}
          </div>

          <div className='flex items-start space-x-3 mb-3'>
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${getPriorityColor(
                task.importance
              )}`}
            ></div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-start space-x-2 mb-2'>
                <h4
                  data-testid="task-name"
                  className={`font-medium break-words flex-1 ${
                    task.isCompleted ? 'line-through text-gray-600' : 'text-gray-900'
                  }`}
                >
                  {task.name}
                </h4>
                {task.isCompleted && (
                  <span className='text-green-600 text-sm font-medium flex items-center space-x-1'>
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                    <span>Terminé</span>
                  </span>
                )}
                {task.link && (
                  <a
                    href={task.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 flex-shrink-0'
                    title='Ouvrir le lien'
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
                    <span>Lien</span>
                  </a>
                )}
              </div>

              <p className='text-sm text-gray-500 mb-2'>
                Importance: {task.importance} | Complexité: {task.complexity} |
                Points: {task.points}
              </p>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className='flex flex-wrap gap-1 mb-3'>
                  {task.tags.map((tag) => (
                    <Tag key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date et actions */}
          <div className='flex items-center justify-between mt-auto'>
            {/* Date */}
            {task.dueDate && (
              <div className='flex flex-col items-start space-y-1'>
                <div className='flex items-center space-x-1'>
                  {getDateIndicator(task.dueDate) && (
                    <span
                      className={`text-sm ${
                        getDateIndicator(task.dueDate)?.className
                      }`}
                      title={getDateIndicator(task.dueDate)?.tooltip}
                    >
                      {getDateIndicator(task.dueDate)?.icon}
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                <span
                  className={`text-xs ${
                    isOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  {isOverdue(task.dueDate) ? 'En retard' : 'Date limite'}
                </span>
              </div>
            )}

            {/* Actions */}
            <TaskActions
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubtask={onCreateSubtask}
              onAssignParent={onAssignParent}
              onEditNote={onEditNote}
              onMarkCompleted={onMarkCompleted}
              onPin={onPin}
              isPinned={isPinned}
              onQuickAction={onQuickAction}
              setShowQuickActions={setShowQuickActions}
              onToggleSubtasks={() => setShowSubtasks(!showSubtasks)}
              showSubtasks={showSubtasks}
              hideOnDesktop={true}
            />
          </div>

          {/* Sous-tâches intégrées */}
          {task.subtasks && task.subtasks.length > 0 && showSubtasks && (
            <div className='mt-3 pt-3 border-t border-gray-200'>
              <div className='text-xs text-gray-500 mb-2 font-medium'>
                Sous-tâches ({task.subtasks.length})
              </div>
              <div className='space-y-2'>
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
                    level={1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Indicateur de sous-tâches masquées */}
          {task.subtasks && task.subtasks.length > 0 && !showSubtasks && (
            <div className='mt-3 pt-3 border-t border-gray-200'>
              <div className='text-xs text-gray-500 bg-gray-100 rounded-md px-2 py-1 inline-flex items-center space-x-1'>
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
                    d='M9 5l7 7-7 7'
                  />
                </svg>
                <span>
                  {task.subtasks.length} sous-tâche
                  {task.subtasks.length > 1 ? 's' : ''} masquée
                  {task.subtasks.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Menu actions rapides (mobile) */}
        {showQuickActions && (
          <QuickActionsMenu
            task={task}
            showSubtasks={showSubtasks}
            onMarkCompleted={onMarkCompleted}
            onCreateSubtask={onCreateSubtask}
            onAssignParent={onAssignParent}
            onPin={onPin}
            isPinned={isPinned}
            onQuickAction={onQuickAction}
            onToggleSubtasks={() => setShowSubtasks(!showSubtasks)}
            onClose={() => setShowQuickActions(false)}
          />
        )}
      </div>


    </div>
  )
}
