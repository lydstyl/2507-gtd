import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import type { Task, UpdateTaskData, Tag } from '../types/task'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: () => void
  task: Task | null
}

export function EditTaskModal({
  isOpen,
  onClose,
  onTaskUpdated,
  task
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<UpdateTaskData>({
    name: '',
    link: '',
    importance: 1,
    urgency: 1,
    priority: 1,
    dueDate: '',
    tagIds: []
  })
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTags()
      if (task) {
        // Formater la date pour l'input date (YYYY-MM-DD)
        const formatDateForInput = (dateString: string) => {
          try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return ''
            return date.toISOString().split('T')[0]
          } catch (error) {
            console.error('Erreur de formatage de date:', error)
            return ''
          }
        }

        setFormData({
          name: task.name,
          link: task.link || '',
          importance: task.importance,
          urgency: task.urgency,
          priority: task.priority,
          dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
          tagIds: task.tags?.map(tag => tag.id) || []
        })
      }
    }
  }, [isOpen, task])

  const loadTags = async () => {
    try {
      const tagsData = await api.getTags()
      setTags(tagsData)
    } catch (err) {
      console.error('Erreur lors du chargement des tags:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    setIsLoading(true)
    setError('')

    try {
      const formattedData = {
        ...formData,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate + 'T00:00:00').toISOString()
          : undefined
      }

      await api.updateTask(task.id, formattedData)
      onTaskUpdated()
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Une erreur inattendue s'est produite")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'importance' || name === 'urgency' || name === 'priority'
          ? parseInt(value)
          : value
    }))
  }

  const handleTagChange = (tagId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: checked
        ? [...(prev.tagIds || []), tagId]
        : (prev.tagIds || []).filter((id) => id !== tagId)
    }))
  }

  if (!isOpen || !task) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Modifier la tâche
            </h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600'
            >
              <svg
                className='w-6 h-6'
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
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-4 space-y-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Nom de la tâche *
            </label>
            <input
              type='text'
              id='name'
              name='name'
              required
              value={formData.name}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label
              htmlFor='link'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Lien (optionnel)
            </label>
            <input
              type='url'
              id='link'
              name='link'
              value={formData.link}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              placeholder='https://...'
            />
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label
                htmlFor='importance'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Importance
              </label>
              <select
                id='importance'
                name='importance'
                value={formData.importance}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              >
                <option value={1}>1 - Faible</option>
                <option value={2}>2 - Moyenne</option>
                <option value={3}>3 - Élevée</option>
                <option value={4}>4 - Très élevée</option>
                <option value={5}>5 - Critique</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='urgency'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Urgence
              </label>
              <select
                id='urgency'
                name='urgency'
                value={formData.urgency}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              >
                <option value={1}>1 - Faible</option>
                <option value={2}>2 - Moyenne</option>
                <option value={3}>3 - Élevée</option>
                <option value={4}>4 - Très élevée</option>
                <option value={5}>5 - Critique</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='priority'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Priorité
              </label>
              <select
                id='priority'
                name='priority'
                value={formData.priority}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              >
                <option value={1}>1 - Faible</option>
                <option value={2}>2 - Moyenne</option>
                <option value={3}>3 - Élevée</option>
                <option value={4}>4 - Très élevée</option>
                <option value={5}>5 - Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor='dueDate'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Date limite (optionnel)
            </label>
            <input
              type='date'
              id='dueDate'
              name='dueDate'
              value={formData.dueDate}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Tags
            </label>
            <div className='space-y-2 max-h-32 overflow-y-auto'>
              {tags.map((tag) => (
                <label key={tag.id} className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={formData.tagIds?.includes(tag.id) || false}
                    onChange={(e) =>
                      handleTagChange(tag.id, e.target.checked)
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span 
                    className='ml-2 text-sm text-gray-700 flex items-center space-x-2'
                  >
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    ></span>
                    <span>{tag.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
            >
              Annuler
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isLoading ? 'Modification...' : 'Modifier la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 