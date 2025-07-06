import React, { useState, useEffect } from 'react'
import type { Tag } from '../types/task'
import { api } from '../utils/api'

interface EditTagModalProps {
  isOpen: boolean
  onClose: () => void
  tag: Tag | null
  onTagUpdated: () => void
}

export function EditTagModal({ isOpen, onClose, tag, onTagUpdated }: EditTagModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tag) {
      setName(tag.name)
      setColor(tag.color || '#3B82F6')
    }
  }, [tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tag) return

    if (!name.trim()) {
      setError('Le nom du tag est requis')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await api.updateTag(tag.id, {
        name: name.trim(),
        color
      })

      onTagUpdated()
      onClose()
    } catch (err: any) {
      setError('Erreur lors de la mise à jour du tag')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen || !tag) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Modifier le tag
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du tag
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom du tag"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                disabled={loading}
              />
              <span className="text-sm text-gray-600">{color}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 