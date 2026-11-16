import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import type { Tag } from '../types/task'

// Tags de champs IA_ cochés à la création : ils autorisent le LLM local à
// remplir/modifier chaque champ correspondant lors du traitement de la tâche
// (bloc « CHAMPS À REMPLIR » du prompt de dispatch).
const IA_FIELD_TAG_NAMES = [
  'IA_nom',
  'IA_lien',
  'IA_priorité',
  'IA_planned_date',
  'IA_due_date',
  'IA_tags',
]

interface PromptTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: () => void
}

export function PromptTaskModal({
  isOpen,
  onClose,
  onTaskCreated
}: PromptTaskModalProps) {
  const [prompt, setPrompt] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    try {
      setTags(await api.getTags())
    } catch (err) {
      console.error('Erreur lors du chargement des tags:', err)
    }
  }

  // Titre provisoire : les 8 premiers mots du prompt (l'IA le remplacera via IA_nom).
  const buildProvisionalTitle = (text: string) => {
    const trimmed = text.trim()
    const words = trimmed.split(/\s+/).slice(0, 8).join(' ')
    return words.length >= 3 ? words : trimmed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = prompt.trim()
    if (!text) return
    setIsLoading(true)
    setError('')

    try {
      // Tags de champs IA_ existants cochés : le LLM local est autorisé à
      // tout remplir (titre, lien, priorité, dates, tags).
      const iaTagIds = tags
        .filter((t) => IA_FIELD_TAG_NAMES.includes(t.name))
        .map((t) => t.id)

      await api.createTask({
        name: buildProvisionalTitle(text),
        note: text,
        status: 'pour_ia',
        tagIds: iaTagIds
      })
      setPrompt('')
      onTaskCreated()
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

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              🤖 Prompter une tâche
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
              htmlFor='prompt'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Prompt (deviendra la note de la tâche) *
            </label>
            <textarea
              id='prompt'
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 font-mono text-sm'
              placeholder="Ex: Configure le chatbot GTD pour qu'il utilise un LLM local, et vérifie que le dispatch des tâches « Pour IA » fonctionne…"
            />
            <p className='mt-2 text-xs text-gray-500'>
              La tâche sera créée au statut «&nbsp;Pour IA&nbsp;» avec tous les
              tags&nbsp;IA_ cochés : le LLM local remplacera le titre provisoire
              et remplira priorité, dates et tags au prochain dispatch.
            </p>
          </div>

          <div className='flex justify-end space-x-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
            >
              Annuler
            </button>
            <button
              type='submit'
              disabled={isLoading || !prompt.trim()}
              className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isLoading ? 'Création…' : 'Créer pour l\u2019IA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
