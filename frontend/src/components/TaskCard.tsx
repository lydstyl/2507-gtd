import type { Task } from '../types/task'
import { Tag } from './Tag'
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

  const getPriorityColor = (importance: number) => {
    switch (importance) {
      case 1:
        return 'bg-black' // Critique - noir
      case 2:
        return 'bg-gray-800' // Très élevée - gris très foncé
      case 3:
        return 'bg-gray-600' // Élevée - gris foncé
      case 4:
        return 'bg-gray-400' // Moyenne - gris moyen
      case 5:
        return 'bg-gray-200' // Faible - gris clair
      default:
        return 'bg-gray-300' // Valeur par défaut
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide'
      }

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Réinitialiser les heures pour la comparaison
      const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
      const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
      const tomorrowOnly = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate()
      )

      if (dateOnly.getTime() === todayOnly.getTime()) {
        return "Aujourd'hui"
      } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
        return 'Demain'
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }
    } catch (error) {
      console.error('Erreur de formatage de date:', error)
      return 'Date invalide'
    }
  }

  const isOverdue = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date < today
    } catch {
      return false
    }
  }

  const getDayOfWeek = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.getDay() // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    } catch {
      return -1
    }
  }

  const getDateIndicator = (dateString: string) => {
    const dayOfWeek = getDayOfWeek(dateString)

    if (dayOfWeek === 3) {
      // Mercredi
      return {
        icon: '🌿',
        tooltip: 'Mercredi',
        className: 'text-green-600'
      }
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Dimanche ou Samedi
      return {
        icon: '🏖️',
        tooltip: 'Week-end',
        className: 'text-orange-600'
      }
    }

    return null
  }

  const indentStyle = level > 0 ? { marginLeft: `${level * 24}px` } : {}

  const selected = selectedTaskId ? selectedTaskId === task.id : isSelected

  return (
    <div style={indentStyle}>
      <div
        data-testid={`task-card-${task.id}`}
        className={`relative border border-gray-200 rounded-lg hover:bg-gray-50 h-full ${
          isEven ? 'bg-gray-50' : 'bg-white'
        } ${selected ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''} ${
          task.isCompleted ? 'opacity-75 bg-green-50 border-green-200' : ''
        }`}
        onClick={() => {
          if (onSelectTask) {
            onSelectTask(task.id)
            console.log('Sélection tâche (clic):', task.name)
          }
        }}
      >
        <div className='flex flex-col h-full p-4'>
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
            <div className='flex items-center space-x-1'>
              {/* Toggle subtasks button */}
              {task.subtasks && task.subtasks.length > 0 && (
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className='p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors hidden md:block'
                  title={
                    showSubtasks
                      ? 'Masquer les sous-tâches'
                      : 'Afficher les sous-tâches'
                  }
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
                </button>
              )}

              {/* Create subtask button */}
              {onCreateSubtask && (
                <button
                  onClick={() => onCreateSubtask(task.id)}
                  className='p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors hidden md:block'
                  title='Ajouter une sous-tâche'
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
                </button>
              )}

              {/* Note button */}
              <button
                onClick={() => onEditNote?.(task)}
                className={`p-1 rounded transition-colors ${
                  task.note
                    ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title={task.note ? 'Modifier la note' : 'Ajouter une note'}
              >
                <div className='relative'>
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
                  {task.note && (
                    <div className='absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-600 rounded-full'></div>
                  )}
                </div>
              </button>

              {/* Assign parent button */}
              {onAssignParent && (
                <button
                  onClick={() => onAssignParent(task)}
                  className='p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors hidden md:block'
                  title='Assigner une tâche parente'
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
                </button>
              )}

              {/* Done button */}
              {onMarkCompleted && !task.isCompleted && (
                <button
                  onClick={() => onMarkCompleted(task.id)}
                  className='p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors hidden md:block'
                  title='Marquer comme terminé'
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
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </button>
              )}

              {/* Edit button */}
              {onEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
                  title='Modifier la tâche'
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
                </button>
              )}
              {/* Pin button */}
              {onPin && (
                <button
                  onClick={() => onPin(task.id)}
                  className={`p-1 rounded transition-colors ${
                    isPinned
                      ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
                      : 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                  title={isPinned ? 'Désépingler la tâche' : 'Épingler la tâche en haut'}
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
                </button>
              )}

              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={() => onDelete(task.id)}
                  className='p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors hidden md:block'
                  title='Supprimer la tâche'
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
                </button>
              )}

              {/* Bouton actions rapides (mobile) */}
              {onQuickAction && (
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
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
          </div>

          {/* Sous-tâches intégrées */}
          {task.subtasks && task.subtasks.length > 0 && showSubtasks && (
            <div className='mt-3 pt-3 border-t border-gray-200'>
              <div className='text-xs text-gray-500 mb-2 font-medium'>
                Sous-tâches ({task.subtasks.length})
              </div>
              <div className='space-y-2'>
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className='bg-gray-50 rounded-md p-2 border border-gray-200'
                    onClick={() => {
                      if (onSelectTask) {
                        onSelectTask(subtask.id)
                      }
                    }}
                  >
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                          subtask.importance
                        )}`}
                      ></div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between'>
                          <h5 className='text-sm font-medium text-gray-900 break-words flex-1 mr-2'>
                            {subtask.name}
                          </h5>
                          <div className='flex items-center space-x-1 flex-shrink-0'>
                            {subtask.dueDate && (
                              <span
                                className={`text-xs font-medium ${
                                  isOverdue(subtask.dueDate) ? 'text-red-600' : 'text-gray-600'
                                }`}
                              >
                                {formatDate(subtask.dueDate)}
                              </span>
                            )}
                            
                            {/* Actions pour les sous-tâches */}
                            <div className='flex items-center space-x-1'>
                              {/* Create subtask button */}
                              {onCreateSubtask && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onCreateSubtask(subtask.id)
                                  }}
                                  className='p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors'
                                  title='Ajouter une sous-tâche'
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
                                </button>
                              )}

                              {/* Note button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditNote?.(subtask)
                                }}
                                className={`p-1 rounded transition-colors ${
                                  subtask.note
                                    ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
                                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                                }`}
                                title={subtask.note ? 'Modifier la note' : 'Ajouter une note'}
                              >
                                <div className='relative'>
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
                                  {subtask.note && (
                                    <div className='absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-600 rounded-full'></div>
                                  )}
                                </div>
                              </button>

                              {/* Assign parent button */}
                              {onAssignParent && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onAssignParent(subtask)
                                  }}
                                  className='p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors'
                                  title='Assigner une tâche parente'
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
                                </button>
                              )}

                              {/* Done button */}
                              {onMarkCompleted && !subtask.isCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkCompleted(subtask.id)
                                  }}
                                  className='p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors'
                                  title='Marquer comme terminé'
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
                                      d='M5 13l4 4L19 7'
                                    />
                                  </svg>
                                </button>
                              )}

                              {/* Edit button */}
                              {onEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(subtask)
                                  }}
                                  className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
                                  title='Modifier la tâche'
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
                                </button>
                              )}

                              {/* Delete button */}
                              {onDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(subtask.id)
                                  }}
                                  className='p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors'
                                  title='Supprimer la tâche'
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
                                </button>
                              )}

                              {/* Bouton actions rapides (mobile) */}
                              {onQuickAction && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Pour les sous-tâches, on peut implémenter un menu d'actions rapides si nécessaire
                                  }}
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
                          </div>
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                          I: {subtask.importance} | C: {subtask.complexity} | P: {subtask.points}
                        </p>
                        {/* Tags des sous-tâches */}
                        {subtask.tags && subtask.tags.length > 0 && (
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {subtask.tags.map((tag) => (
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
                            ))}
                          </div>
                        )}

                        {/* Sous-sous-tâches */}
                        {subtask.subtasks && subtask.subtasks.length > 0 && (
                          <div className='mt-2 pt-2 border-t border-gray-200'>
                            <div className='text-xs text-gray-500 mb-1 font-medium'>
                              Sous-sous-tâches ({subtask.subtasks.length})
                            </div>
                            <div className='space-y-1'>
                              {subtask.subtasks.map((subSubtask) => (
                                <div
                                  key={subSubtask.id}
                                  className='bg-gray-100 rounded-sm p-1.5 border border-gray-300'
                                  onClick={() => {
                                    if (onSelectTask) {
                                      onSelectTask(subSubtask.id)
                                    }
                                  }}
                                >
                                  <div className='flex items-center space-x-2'>
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(
                                        subSubtask.importance
                                      )}`}
                                    ></div>
                                    <div className='flex-1 min-w-0'>
                                      <div className='flex items-start justify-between'>
                                        <h6 className='text-xs font-medium text-gray-900 break-words flex-1 mr-1'>
                                          {subSubtask.name}
                                        </h6>
                                        <div className='flex items-center space-x-1 flex-shrink-0'>
                                          {subSubtask.dueDate && (
                                            <span
                                              className={`text-xs font-medium ${
                                                isOverdue(subSubtask.dueDate) ? 'text-red-600' : 'text-gray-600'
                                              }`}
                                            >
                                              {formatDate(subSubtask.dueDate)}
                                            </span>
                                          )}
                                          
                                          {/* Actions pour les sous-sous-tâches */}
                                          <div className='flex items-center space-x-0.5'>
                                            {/* Create subtask button */}
                                            {onCreateSubtask && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  onCreateSubtask(subSubtask.id)
                                                }}
                                                className='p-0.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors'
                                                title='Ajouter une sous-tâche'
                                              >
                                                <svg
                                                  className='w-2.5 h-2.5'
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
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                onEditNote?.(subSubtask)
                                              }}
                                              className={`p-0.5 rounded transition-colors ${
                                                subSubtask.note
                                                  ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
                                                  : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                                              }`}
                                              title={subSubtask.note ? 'Modifier la note' : 'Ajouter une note'}
                                            >
                                              <div className='relative'>
                                                <svg
                                                  className='w-2.5 h-2.5'
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
                                                {subSubtask.note && (
                                                  <div className='absolute -top-0.5 -right-0.5 w-1 h-1 bg-purple-600 rounded-full'></div>
                                                )}
                                              </div>
                                            </button>

                                            {/* Assign parent button */}
                                            {onAssignParent && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  onAssignParent(subSubtask)
                                                }}
                                                className='p-0.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors'
                                                title='Assigner une tâche parente'
                                              >
                                                <svg
                                                  className='w-2.5 h-2.5'
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
                                            {onMarkCompleted && !subSubtask.isCompleted && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  onMarkCompleted(subSubtask.id)
                                                }}
                                                className='p-0.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors'
                                                title='Marquer comme terminé'
                                              >
                                                <svg
                                                  className='w-2.5 h-2.5'
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
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  onEdit(subSubtask)
                                                }}
                                                className='p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
                                                title='Modifier la tâche'
                                              >
                                                <svg
                                                  className='w-2.5 h-2.5'
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

                                            {/* Delete button */}
                                            {onDelete && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  onDelete(subSubtask.id)
                                                }}
                                                className='p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors'
                                                title='Supprimer la tâche'
                                              >
                                                <svg
                                                  className='w-2.5 h-2.5'
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
                                          </div>
                                        </div>
                                      </div>
                                      <p className='text-xs text-gray-500 mt-0.5'>
                                        I: {subSubtask.importance} | C: {subSubtask.complexity} | P: {subSubtask.points}
                                      </p>
                                      {/* Tags des sous-sous-tâches */}
                                      {subSubtask.tags && subSubtask.tags.length > 0 && (
                                        <div className='flex flex-wrap gap-0.5 mt-0.5'>
                                          {subSubtask.tags.map((tag) => (
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
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
          <div className='absolute top-full left-0 right-0 z-50 border border-gray-200 rounded-b-lg p-4 bg-white shadow-lg'>
            <div className='text-sm font-medium text-gray-700 mb-3'>Actions rapides</div>
            <div className='grid grid-cols-2 gap-2'>
              {/* Task Actions */}

              {onMarkCompleted && !task.isCompleted && (
                <button
                  onClick={() => {
                    onMarkCompleted(task.id)
                    setShowQuickActions(false)
                  }}
                  className='px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center space-x-1'
                >
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  <span>Terminer</span>
                </button>
              )}

              {onCreateSubtask && (
                <button
                  onClick={() => {
                    onCreateSubtask(task.id)
                    setShowQuickActions(false)
                  }}
                  className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center space-x-1'
                >
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                  </svg>
                  <span>Sous-tâche</span>
                </button>
              )}

              {onAssignParent && (
                <button
                  onClick={() => {
                    onAssignParent(task)
                    setShowQuickActions(false)
                  }}
                  className='px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center space-x-1'
                >
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                  </svg>
                  <span>Parent</span>
                </button>
              )}
              {onPin && (
                <button
                  onClick={() => {
                    onPin(task.id)
                    setShowQuickActions(false)
                  }}
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

              {task.subtasks && task.subtasks.length > 0 && (
                <button
                  onClick={() => {
                    setShowSubtasks(!showSubtasks)
                    setShowQuickActions(false)
                  }}
                  className='px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center justify-center space-x-1'
                >
                  <svg className={`w-3 h-3 transition-transform ${showSubtasks ? 'rotate-90' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                  <span>{showSubtasks ? 'Masquer' : 'Afficher'} sous-tâches</span>
                </button>
              )}

              {/* Quick Edits */}
              {onQuickAction && (
                <>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'importance-up')
                      setShowQuickActions(false)
                    }}
                    className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
                  >
                    ↑ Importance
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'importance-down')
                      setShowQuickActions(false)
                    }}
                    className='px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
                  >
                    ↓ Importance
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'complexity-up')
                      setShowQuickActions(false)
                    }}
                    className='px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200'
                  >
                    ↑ Complexité
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'complexity-down')
                      setShowQuickActions(false)
                    }}
                    className='px-3 py-2 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200'
                  >
                    ↓ Complexité
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'date-today')
                      setShowQuickActions(false)
                    }}
                    className='px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200'
                  >
                    Date aujourd'hui
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'date-remove')
                      setShowQuickActions(false)
                    }}
                    className='px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
                  >
                    Enlever date
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction(task.id, 'delete')
                      setShowQuickActions(false)
                    }}
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
        )}
      </div>


    </div>
  )
}
