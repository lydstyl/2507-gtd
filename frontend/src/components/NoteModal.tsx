import { useState, useEffect, type ChangeEvent } from 'react'
import { NoteEditor } from './NoteEditor'
import type { Task, TaskStatus } from '../types/task'
import { TASK_STATUS_LABELS } from '../types/task'

interface NoteModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onSave: (taskId: string, note: string) => void
  onSaveName?: (taskId: string, name: string) => Promise<void>
  onSaveStatus?: (taskId: string, status: TaskStatus) => Promise<void> | void
  onDelete?: (taskId: string) => void
  onOpenEdit?: (task: Task) => void
  onMarkCompleted?: (taskId: string) => Promise<void> | void
}

export function NoteModal({
  task,
  isOpen,
  onClose,
  onSave,
  onSaveName,
  onSaveStatus,
  onDelete,
  onOpenEdit,
  onMarkCompleted
}: NoteModalProps) {
  const [note, setNote] = useState(task?.note || '')
  const [name, setName] = useState(task?.name || '')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'brouillon')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isStatusSaving, setIsStatusSaving] = useState(false)

  // Synchronise l'éditeur quand la note arrive (lazy-load : la tâche passée
  // vient d'abord de la liste sans note, puis du détail GET /api/tasks/:id).
  // `task` est stable entre les renders (référence React Query) : pas de
  // reset de la saisie utilisateur.
  useEffect(() => {
    if (isOpen && task) {
      setNote(task.note || '')
      setName(task.name || '')
      setStatus(task.status || 'brouillon')
    }
  }, [isOpen, task])

  // La note est attendue (hasNote) mais pas encore chargée (lazy-load).
  const isLoadingNote = Boolean(task?.hasNote) && task?.note === undefined

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(task.id, note)
      // Titre modifié dans le header ? Sauvegardé avec la note.
      const trimmedName = name.trim()
      if (onSaveName && trimmedName && trimmedName !== task.name) {
        await onSaveName(task.id, trimmedName)
      }
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
    setName(task?.name || '')
    setStatus(task?.status || 'brouillon')
    onClose()
  }

  // Changer le statut depuis la note : sauvegarde IMMÉDIATE au changement
  // (indépendante de « Sauvegarder », qui gère la note). Rollback local si
  // l'appel échoue.
  const handleStatusChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as TaskStatus
    setStatus(next)
    if (!onSaveStatus || next === task.status) return
    setIsStatusSaving(true)
    try {
      await onSaveStatus(task.id, next)
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error)
      alert('Erreur lors de la modification du statut')
      setStatus(task.status)
    } finally {
      setIsStatusSaving(false)
    }
  }

  // Terminer la tâche depuis la note : complète puis ferme la modale.
  const handleMarkCompleted = async () => {
    if (!onMarkCompleted) return
    setIsCompleting(true)
    try {
      await onMarkCompleted(task.id)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la complétion de la tâche:", error)
      alert('Erreur lors de la modification du statut de la tâche')
    } finally {
      setIsCompleting(false)
    }
  }

  if (!isOpen || !task) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex-1 min-w-0 pr-4'>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
              }}
              aria-label='Titre de la tâche (modifiable)'
              className='w-full bg-transparent text-xl font-semibold text-gray-900 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors'
            />
            <p className='text-sm text-gray-500 mt-1'>
              Titre modifiable (Entrée = sauvegarder) — puis la note en dessous.
            </p>
            {onSaveStatus && (
              <div className='flex items-center gap-2 mt-3'>
                <label
                  htmlFor='note-status'
                  className='text-sm font-medium text-gray-700'
                >
                  Statut
                </label>
                <select
                  id='note-status'
                  value={status}
                  onChange={handleStatusChange}
                  disabled={isStatusSaving}
                  title='Changer le statut de la tâche (sauvegarde immédiate)'
                  className='px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50'
                >
                  {(
                    Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {isStatusSaving && (
                  <span className='text-xs text-gray-500'>
                    Sauvegarde…
                  </span>
                )}
              </div>
            )}
          </div>
          <div className='flex items-center space-x-2 shrink-0'>
            {onOpenEdit && (
              <button
                onClick={() => onOpenEdit(task)}
                className='px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center space-x-1.5'
                title='Ouvrir la modale de modification de la tâche (titre, tags, dates…)'
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
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                <span>Éditer la tâche</span>
              </button>
            )}
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
        </div>

        {/* Content */}
        <div className='flex-1 p-6 overflow-y-auto'>
          {isLoadingNote ? (
            <div className='flex items-center justify-center h-full text-gray-400'>
              <svg
                className='animate-spin h-6 w-6 mr-3'
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
              Chargement de la note...
            </div>
          ) : (
            <NoteEditor
              content={note}
              onChange={setNote}
              placeholder='Tapez votre note ici... Vous pouvez utiliser les outils de formatage ci-dessus pour mettre en forme votre texte.'
            />
          )}
        </div>

        {/* Footer */}
        <div className='grid grid-cols-2 gap-2 p-6 border-t border-gray-200 md:flex md:flex-row md:items-center md:justify-between'>
          <div className='contents md:flex md:flex-row md:items-center md:gap-3'>
            <button
              onClick={handleClose}
              className='order-1 md:order-none w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors md:w-auto'
              disabled={isSaving || isDeleting}
            >
              Annuler
            </button>
            {task.hasNote && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className='order-3 md:order-none w-full px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:w-auto'
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
          <div className='contents md:flex md:flex-row md:items-center md:gap-3'>
            {onMarkCompleted && !task.isCompleted && (
              <button
                onClick={handleMarkCompleted}
                disabled={isSaving || isDeleting || isCompleting}
                className='order-4 md:order-none w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:w-auto'
                title='Marquer la tâche comme terminée et fermer la note'
              >
                {isCompleting ? (
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
                    <span>En cours...</span>
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
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                    <span>Terminer</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting || isCompleting}
              className='order-2 md:order-none w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:w-auto'
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
    </div>
  )
}
