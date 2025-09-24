import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import type { CreateTaskData, Tag } from '../types/task'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: () => void
  parentId?: string // ID de la tâche parente pour créer une sous-tâche
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  parentId
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState<CreateTaskData>({
    name: '',
    link: '',
    // Don't set default values - let backend decide if it's a collection task
    plannedDate: '',
    date2: '',
    tagIds: [],
    parentId: parentId // Initialiser avec le parentId si fourni
  })
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  // Mettre à jour le parentId quand la prop change
  useEffect(() => {
    console.log('🔄 parentId changé:', parentId)
    setFormData(prev => ({
      ...prev,
      parentId: parentId
    }))
  }, [parentId])

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
    setIsLoading(true)
    setError('')

    try {
      console.log('📤 Envoi des données:', formData)
      
      // Formater la date correctement pour le backend
      const formattedData = {
        ...formData,
        plannedDate: formData.plannedDate || undefined,
        date2: formData.date2 || undefined
      }

      await api.createTask(formattedData)
      onTaskCreated()
      onClose()
      // Reset form
      setFormData({
        name: '',
        link: '',
        // Don't set default values - let backend decide if it's a collection task
        plannedDate: '',
        date2: '',
        tagIds: [],
        parentId: parentId // Reset parentId
      })
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
        name === 'importance' || name === 'complexity'
          ? value === '' ? undefined : parseInt(value)
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

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              {parentId ? 'Nouvelle sous-tâche' : 'Nouvelle tâche'}
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
              placeholder='Ex: Réviser le projet GTD'
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

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='importance'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Importance: {formData.importance || '50 (défaut collection)'}
              </label>
              <input
                type='range'
                id='importance'
                name='importance'
                min='0'
                max='50'
                value={formData.importance || ''}
                onChange={handleChange}
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
              />
              <div className='flex justify-between text-xs text-gray-500 mt-1'>
                <span>0 (Faible)</span>
                <span>50 (Max)</span>
              </div>
            </div>

            <div>
              <label
                htmlFor='complexity'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Complexité: {formData.complexity || '1 (défaut collection)'}
              </label>
              <input
                type='range'
                id='complexity'
                name='complexity'
                min='1'
                max='9'
                value={formData.complexity || ''}
                onChange={handleChange}
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
              />
              <div className='flex justify-between text-xs text-gray-500 mt-1'>
                <span>1 (Simple)</span>
                <span>9 (Complexe)</span>
              </div>
            </div>

          </div>

          <div>
            <label
              htmlFor='plannedDate'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Date limite (optionnel)
            </label>
            <input
              type='date'
              id='plannedDate'
              name='plannedDate'
              value={formData.plannedDate}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label
              htmlFor='date2'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Date 2 (optionnel)
            </label>
            <input
              type='date'
              id='date2'
              name='date2'
              value={formData.date2}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {tags.length > 0 && (
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
                    <span className='ml-2 text-sm text-gray-700'>
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
              {isLoading ? 'Création...' : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
