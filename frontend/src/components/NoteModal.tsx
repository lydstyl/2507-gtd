import { useState } from 'react'
import { NoteEditor } from './NoteEditor'
import type { Task } from '../types/task'

interface NoteModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onSave: (taskId: string, note: string) => void
  onDelete?: (taskId: string) => void
}

export function NoteModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete
}: NoteModalProps) {
  const [note, setNote] = useState(task?.note || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(task.id, note)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setNote(task?.note || '')
    onClose()
  }

  if (!isOpen || !task) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Note pour "{task.name}"
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              Utilisez l'éditeur ci-dessous pour ajouter ou modifier la note de
              cette tâche
            </p>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
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

        {/* Content */}
        <div className='flex-1 p-6 overflow-y-auto'>
          <NoteEditor
            content={note}
            onChange={setNote}
            placeholder='Tapez votre note ici... Vous pouvez utiliser les outils de formatage ci-dessus pour mettre en forme votre texte.'
          />
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t border-gray-200'>
          <div className='flex items-center space-x-3'>
            <button
              onClick={handleClose}
              className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
              disabled={isSaving || isDeleting}
            >
              Annuler
            </button>
            {task.note && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
              >
                {isDeleting ? (
                  <>
                    <svg
                      className='animate-spin h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
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
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                    <span>Supprimer la note</span>
                  </>
                )}
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
          >
            {isSaving ? (
              <>
                <svg
                  className='animate-spin h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                <span>Sauvegarde...</span>
              </>
            ) : (
              <span>Sauvegarder</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
