import { useState } from 'react'
import { api, ApiError } from '../utils/api'
import type { CreateTagData } from '../types/task'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onTagCreated: () => void
}

export function CreateTagModal({
  isOpen,
  onClose,
  onTagCreated
}: CreateTagModalProps) {
  const [formData, setFormData] = useState<CreateTagData>({
    name: '',
    color: '#3B82F6' // Couleur par défaut (bleu)
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await api.createTag(formData)
      onTagCreated()
      onClose()
      // Reset form
      setFormData({
        name: '',
        color: '#3B82F6'
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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Nouveau tag
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
              Nom du tag *
            </label>
            <input
              type='text'
              id='name'
              name='name'
              required
              value={formData.name}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              placeholder='Ex: Travail, Personnel, Urgent'
            />
          </div>

          <div>
            <label
              htmlFor='color'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Couleur
            </label>
            <div className='flex items-center space-x-3'>
              <input
                type='color'
                id='color'
                name='color'
                value={formData.color}
                onChange={handleChange}
                className='w-12 h-10 border border-gray-300 rounded-md cursor-pointer'
              />
              <span className='text-sm text-gray-500'>
                Choisissez une couleur pour identifier facilement ce tag
              </span>
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
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isLoading ? 'Création...' : 'Créer le tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 