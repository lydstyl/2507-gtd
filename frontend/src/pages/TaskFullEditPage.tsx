import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TaskDateConsistencyService } from '@gtd/shared'
import { useTask, useUpdateTask, useUpdateTaskNote } from '../hooks/useTasks'
import { useTaskDetailShortcuts } from '../hooks/useTaskDetailShortcuts'
import { api, ApiError } from '../utils/api'
import { NoteEditor } from '../components/NoteEditor'
import { ImportanceSlider } from '../components/ImportanceSlider'
import { TagPickerModal } from '../components/TagPickerModal'
import { CompleteConfirmModal } from '../components/CompleteConfirmModal'
import { ShortcutsHelp } from '../components/ShortcutsHelp'
import type { Tag, Task, TaskStatus, UpdateTaskData } from '../types/task'
import { TASK_STATUS_LABELS } from '../types/task'

// Formater une date ISO pour un input date (YYYY-MM-DD) en heure locale
// (mêmes règles que EditTaskModal pour éviter les décalages de timezone).
const formatDateForInput = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

interface FormState {
  name: string
  link: string
  importance: number
  complexity: number
  status: TaskStatus
  plannedDate: string
  dueDate: string
  tagIds: string[]
}

const formFromTask = (task: Task): FormState => ({
  name: task.name,
  link: task.link || '',
  importance: task.importance,
  complexity: task.complexity,
  status: task.status ?? 'brouillon',
  plannedDate: task.plannedDate ? formatDateForInput(task.plannedDate) : '',
  dueDate: task.dueDate ? formatDateForInput(task.dueDate) : '',
  tagIds: task.tags?.map((tag) => tag.id) || []
})

/** Élément <kbd> pour afficher un raccourci clavier sur un bouton/champ. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className='ml-1.5 px-1.5 py-0.5 text-[10px] bg-gray-100 border border-gray-300 rounded font-mono text-gray-500 select-none'>
      {children}
    </kbd>
  )
}

/**
 * Page plein écran « tâche » : toutes les options de la modale d'édition de la
 * tâche (titre, lien, statut, importance, dates, tags) ET de la modale de note
 * (titre, statut, éditeur de note) au même endroit. Ouverte via le bouton
 * « Ouvrir en plein écran » des cartes de tâche (nouvel onglet).
 *
 * Raccourcis clavier (H pour afficher l'aide) :
 *   Ctrl+S → sauvegarder · Escape → retour
 *   B/P/L/R/U/N/V → statut · I/⇧I → importance · C/⇧C → complexité
 *   D/⇧D/W/M/T/E → dates · 1-9 → tags
 */
export function TaskFullEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: task, isLoading, error } = useTask(id)

  const [form, setForm] = useState<FormState | null>(null)
  const [baseline, setBaseline] = useState<FormState | null>(null)
  const [note, setNote] = useState('')
  const [noteBaseline, setNoteBaseline] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  const updateTask = useUpdateTask()
  const updateTaskNote = useUpdateTaskNote()

  // Init du formulaire une seule fois par tâche (ne pas écraser la saisie).
  useEffect(() => {
    if (task && !form) {
      const initial = formFromTask(task)
      setForm(initial)
      setBaseline(initial)
      setNote(task.note || '')
      setNoteBaseline(task.note || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task])

  useEffect(() => {
    api.getTags().then(setTags).catch(console.error)
  }, [])

  // ── Touche H : afficher/cacher l'aide raccourcis ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        const inField =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'
        if (!inField) {
          e.preventDefault()
          setShowShortcutsHelp((v) => !v)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Refs pour les fonctions passées au hook (définies après les early returns) ──
  const handleSaveRef = useRef<() => Promise<void>>(async () => {})
  const handleBackRef = useRef<() => void>(() => {})

  // ── Hook raccourcis clavier (appelé avant les early returns, règle React) ──
  useTaskDetailShortcuts({
    taskId: id,
    form,
    setForm,
    setBaseline,
    tags,
    onSave: () => handleSaveRef.current(),
    onBack: () => handleBackRef.current(),
    isSaving,
    onRequestComplete: () => setShowCompleteConfirm(true),
    onOpenTagPicker: () => setShowTagPicker(true),
    modalOpen: showTagPicker || showCompleteConfirm,
  })

  if (error) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50'>
        <p className='text-gray-700'>Tâche introuvable ou erreur de chargement.</p>
        <button
          onClick={() => navigate('/tasks')}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  if (isLoading || !task || !form || !baseline) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  const buildUpdateData = (): UpdateTaskData => {
    const alignedDueDate = TaskDateConsistencyService.alignDueDateWithPlannedDate(
      form.plannedDate || null,
      form.dueDate || null
    )
    return {
      name: form.name,
      link: form.link,
      importance: form.importance,
      complexity: form.complexity,
      status: form.status,
      plannedDate: form.plannedDate || null,
      dueDate: alignedDueDate || null,
      tagIds: form.tagIds
    }
  }

  const formDirty =
    JSON.stringify(form) !== JSON.stringify(baseline)
  const noteDirty = note !== noteBaseline

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => {
      if (!prev) return prev
      const next: FormState = {
        ...prev,
        [name]:
          name === 'importance' || name === 'complexity'
            ? parseInt(value)
            : name === 'status'
              ? (value as TaskStatus)
              : value
      }
      if (name === 'plannedDate') {
        next.dueDate =
          TaskDateConsistencyService.alignDueDateWithPlannedDate(
            next.plannedDate || null,
            prev.dueDate || null
          ) ?? ''
      }
      return next
    })
  }

  const handleTagChange = (tagId: string, checked: boolean) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            tagIds: checked
              ? [...prev.tagIds, tagId]
              : prev.tagIds.filter((t) => t !== tagId)
          }
        : prev
    )
  }

  const handleSave = async () => {
    setSaveError('')
    setIsSaving(true)
    try {
      if (formDirty) {
        await updateTask.mutateAsync({ id: task.id, data: buildUpdateData() })
      }
      if (noteDirty) {
        await updateTaskNote.mutateAsync({ id: task.id, note })
      }
      if (baseline) setBaseline(form)
      setNoteBaseline(note)
      setSavedAt(Date.now())
      setTimeout(() => setSavedAt(null), 2000)
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Une erreur inattendue s'est produite"
      )
    } finally {
      setIsSaving(false)
    }
  }
  handleSaveRef.current = handleSave

  const handleMarkCompleted = async () => {
    setSaveError('')
    setIsCompleting(true)
    try {
      // Sauvegarder d'abord pour ne rien perdre.
      if (formDirty) {
        await updateTask.mutateAsync({ id: task.id, data: buildUpdateData() })
        setBaseline(form)
      }
      if (noteDirty) {
        await updateTaskNote.mutateAsync({ id: task.id, note })
        setNoteBaseline(note)
      }
      await api.markTaskCompleted(task.id)
      window.close()
      navigate('/tasks')
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : 'Erreur lors de la complétion'
      )
    } finally {
      setIsCompleting(false)
    }
  }

  const handleBack = () => {
    if (window.opener) window.close()
    else navigate('/tasks')
  }
  handleBackRef.current = handleBack

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between gap-3 sticky top-0 z-10'>
        <div className='flex items-center gap-3 min-w-0'>
          <button
            onClick={handleBack}
            className='text-gray-500 hover:text-gray-800 shrink-0'
            title='Retour à la liste (Esc)'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
            </svg>
            <Kbd>Esc</Kbd>
          </button>
          <h1 className='text-lg font-semibold text-gray-900 truncate'>
            {form.name || '(sans titre)'}
          </h1>
          <span className='text-xs text-gray-400 shrink-0 hidden md:inline'>
            Créée le {new Date(task.createdAt).toLocaleDateString('fr-FR')} —
            Modifiée le {new Date(task.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {savedAt && <span className='text-sm text-green-600'>Enregistré ✓</span>}
          {!task.isCompleted && (
            <button
              onClick={handleMarkCompleted}
              disabled={isSaving || isCompleting}
              className='px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center'
              title='Sauvegarder puis marquer la tâche comme terminée (X, avec confirmation)'
            >
              {isCompleting ? '...' : 'Terminer'}
              <Kbd>X</Kbd>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || (!formDirty && !noteDirty)}
            className='px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center'
            title='Sauvegarder (Ctrl+S)'
          >
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
            <Kbd>Ctrl+S</Kbd>
          </button>
        </div>
      </header>

      {saveError && (
        <div className='mx-4 md:mx-8 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
          {saveError}
        </div>
      )}

      <div className='flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 p-4 md:p-8 items-start'>
        {/* Colonne gauche : champs de la tâche (modale d'édition) */}
        <div className='bg-white rounded-lg shadow p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide'>
              Tâche
            </h2>
            <button
              onClick={() => setShowShortcutsHelp((v) => !v)}
              className='text-xs text-blue-600 hover:text-blue-800 flex items-center'
              title='Afficher/cacher les raccourcis clavier (H)'
            >
              ⌨ Raccourcis <Kbd>H</Kbd>
            </button>
          </div>

          {/* Aide raccourcis clavier (composant partagé, groupé + codé en couleur) */}
          <ShortcutsHelp
            showShortcutsHelp={showShortcutsHelp}
            setShowShortcutsHelp={setShowShortcutsHelp}
            tags={tags}
            context='detail'
            showToggle={false}
          />

          <div>
            <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
              Nom de la tâche *
            </label>
            <input
              type='text'
              id='name'
              name='name'
              required
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label htmlFor='link' className='block text-sm font-medium text-gray-700 mb-1'>
                Lien (optionnel)
              </label>
              <input
                type='url'
                id='link'
                name='link'
                value={form.link}
                onChange={handleChange}
                placeholder='https://...'
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
                Statut
              </label>
              <select
                id='status'
                name='status'
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
              <div className='mt-1 text-[10px] text-gray-400'>
                Raccourcis : B · P · L · R · U · N · V
              </div>
            </div>
          </div>

          <div>
            <ImportanceSlider
              value={form.importance}
              onChange={(value) => setForm((prev) => prev && { ...prev, importance: value })}
            />
            <div className='mt-1 text-[10px] text-gray-400'>
              Raccourcis : I (+10) · ⇧I (−10)
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Dates</label>
            <div className='grid grid-cols-[1fr_1fr_auto] gap-2 items-end'>
              <div>
                <input
                  type='date'
                  id='plannedDate'
                  name='plannedDate'
                  value={form.plannedDate}
                  onChange={handleChange}
                  placeholder='Date prévue'
                  className={`${inputClass} text-sm`}
                />
              </div>
              <div>
                <input
                  type='date'
                  id='dueDate'
                  name='dueDate'
                  value={form.dueDate}
                  onChange={handleChange}
                  placeholder='Date limite'
                  className={`${inputClass} text-sm`}
                />
              </div>
              {(form.plannedDate || form.dueDate) && (
                <button
                  type='button'
                  onClick={() =>
                    setForm((prev) => prev && { ...prev, plannedDate: '', dueDate: '' })
                  }
                  className='px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded-md whitespace-nowrap'
                  title='Effacer les dates (E)'
                >
                  Effacer
                </button>
              )}
            </div>
            <div className='mt-1 text-[10px] text-gray-400'>
              Raccourcis : D (+1j) · ⇧D (−1j) · W (+1 sem) · M (+1 mois) · T (auj.) · E (effacer)
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='block text-sm font-medium text-gray-700'>Tags</label>
              <button
                onClick={() => setShowTagPicker(true)}
                className='text-[10px] text-gray-400 hover:text-blue-600'
                title="Ouvrir le sélecteur de tags (touche A — tous les tags)"
              >
                Raccourcis : 1-9 · <kbd className='px-1 py-0 text-[9px] bg-gray-100 border border-gray-200 rounded font-mono text-gray-400'>A</kbd> tous
              </button>
            </div>
            <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
              {tags.map((tag, idx) => (
                <label key={tag.id} className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={form.tagIds.includes(tag.id)}
                    onChange={(e) => handleTagChange(tag.id, e.target.checked)}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 flex items-center space-x-2'>
                    <span
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    ></span>
                    <span>{tag.name}</span>
                    {idx < 9 && (
                      <kbd className='px-1 py-0 text-[9px] bg-gray-100 border border-gray-200 rounded font-mono text-gray-400'>
                        {idx + 1}
                      </kbd>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite : note (modale de note) */}
        <div className='bg-white rounded-lg shadow p-6 min-h-[60vh] flex flex-col'>
          <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
            Note
          </h2>
          {task.hasNote && task.note === undefined ? (
            <div className='flex-1 flex items-center justify-center text-gray-400'>
              Chargement de la note...
            </div>
          ) : (
            <div className='flex-1'>
              <NoteEditor
                content={note}
                onChange={setNote}
                placeholder='Tapez votre note ici... Vous pouvez utiliser les outils de formatage ci-dessus pour mettre en forme votre texte.'
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals : confirmation « Terminer » + sélecteur de tags */}
      <CompleteConfirmModal
        open={showCompleteConfirm}
        onConfirm={() => {
          setShowCompleteConfirm(false)
          void handleMarkCompleted()
        }}
        onCancel={() => setShowCompleteConfirm(false)}
      />
      <TagPickerModal
        open={showTagPicker}
        tags={tags}
        selectedIds={form.tagIds}
        onToggle={(tagId) => handleTagChange(tagId, !form.tagIds.includes(tagId))}
        onClose={() => setShowTagPicker(false)}
      />
    </div>
  )
}
