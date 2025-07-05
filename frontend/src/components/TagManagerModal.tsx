import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import type { Tag } from '../types/task'

interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TagManagerModal({ isOpen, onClose }: TagManagerModalProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    setIsLoading(true)
    setError('')
    try {
      const tagsData = await api.getTags()
      setTags(tagsData)
    } catch (err) {
      setError("Erreur lors du chargement des tags")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (window.confirm('Supprimer ce tag ?')) {
      try {
        await api.deleteTag(tagId)
        loadTags()
      } catch (err) {
        setError("Erreur lors de la suppression du tag")
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
        <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>Gérer les tags</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
        <div className='px-6 py-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>
              {error}
            </div>
          )}
          {isLoading ? (
            <div className='text-center text-gray-500'>Chargement...</div>
          ) : tags.length === 0 ? (
            <div className='text-center text-gray-500'>Aucun tag</div>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {tags.map((tag) => (
                <li key={tag.id} className='flex items-center justify-between py-2'>
                  <div className='flex items-center space-x-2'>
                    <span
                      className='inline-block w-4 h-4 rounded-full border border-gray-300'
                      style={{ backgroundColor: tag.color || '#e5e7eb' }}
                    ></span>
                    <span className='text-gray-900'>{tag.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className='p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
                    title='Supprimer le tag'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 