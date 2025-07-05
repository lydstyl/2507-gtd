import type { Task } from '../types/task'
import { Tag } from './Tag'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onCreateSubtask?: (parentId: string) => void
  level?: number
  isEven?: boolean
}

export function TaskCard({ task, onEdit, onDelete, onCreateSubtask, level = 0, isEven = false }: TaskCardProps) {
  const getPriorityColor = (importance: number) => {
    switch (importance) {
      case 1: return 'bg-black'      // Critique - noir
      case 2: return 'bg-gray-800'   // Très élevée - gris très foncé
      case 3: return 'bg-gray-600'   // Élevée - gris foncé
      case 4: return 'bg-gray-400'   // Moyenne - gris moyen
      case 5: return 'bg-gray-200'   // Faible - gris clair
      default: return 'bg-gray-300'  // Valeur par défaut
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
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

      if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Aujourd\'hui'
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
    } catch (error) {
      return false
    }
  }

  const getDayOfWeek = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.getDay() // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    } catch (error) {
      return -1
    }
  }

  const getDateIndicator = (dateString: string) => {
    const dayOfWeek = getDayOfWeek(dateString)
    
    if (dayOfWeek === 3) { // Mercredi
      return {
        icon: '🌿',
        tooltip: 'Mercredi',
        className: 'text-green-600'
      }
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Dimanche ou Samedi
      return {
        icon: '🏖️',
        tooltip: 'Week-end',
        className: 'text-orange-600'
      }
    }
    
    return null
  }

  const indentStyle = level > 0 ? { marginLeft: `${level * 24}px` } : {}

  return (
    <div style={indentStyle}>
      <div className={`border border-gray-200 rounded-lg hover:bg-gray-50 mb-2 ${isEven ? 'bg-gray-50' : 'bg-white'}`}>
        <div className='flex items-center justify-between p-4'>
          <div className='flex items-center space-x-3 flex-1'>
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.importance)}`}></div>
            <div className='flex-1'>
              <div className='flex items-center space-x-2'>
                <h4 className='font-medium text-gray-900'>{task.name}</h4>
                {task.link && (
                  <a
                    href={task.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1'
                    title='Ouvrir le lien'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                    </svg>
                    <span>Lien</span>
                  </a>
                )}
              </div>
              
              <p className='text-sm text-gray-500 mt-1'>
                Importance: {task.importance} | Urgence: {task.urgency} | Priorité: {task.priority}
              </p>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className='flex flex-wrap gap-1 mt-2'>
                  {task.tags.map((tag) => (
                    <Tag key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            {/* Date */}
            {task.dueDate && (
              <div className='flex flex-col items-end space-y-1'>
                <div className='flex items-center space-x-1'>
                  {getDateIndicator(task.dueDate) && (
                    <span 
                      className={`text-sm ${getDateIndicator(task.dueDate)?.className}`}
                      title={getDateIndicator(task.dueDate)?.tooltip}
                    >
                      {getDateIndicator(task.dueDate)?.icon}
                    </span>
                  )}
                  <span className={`text-sm font-medium ${isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
                <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-500'}`}>
                  {isOverdue(task.dueDate) ? 'En retard' : 'Date limite'}
                </span>
              </div>
            )}

            {/* Create subtask button */}
            {onCreateSubtask && (
              <button
                onClick={() => onCreateSubtask(task.id)}
                className='p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
                title='Ajouter une sous-tâche'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                </svg>
              </button>
            )}

            {/* Edit button */}
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors'
                title='Modifier la tâche'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                </svg>
              </button>
            )}

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className='p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
                title='Supprimer la tâche'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sous-tâches avec indentation */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className='space-y-1'>
          {task.subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubtask={onCreateSubtask}
              level={level + 1}
              isEven={isEven}
            />
          ))}
        </div>
      )}
    </div>
  )
} 