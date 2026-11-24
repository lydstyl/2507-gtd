import { useEffect, useRef } from 'react'
import type { Tag, Task, TaskStatus, UpdateTaskData } from '../types/task'
import { api } from '../utils/api'
import {
  computeImportanceUpdate,
  computeComplexityUpdate,
  computeDateUpdate,
  toggleTagUpdate,
  withDateConsistency,
  type DateShiftOp,
} from '../utils/shortcutActions'
import { TaskDateConsistencyService } from '@gtd/shared'

/**
 * Raccourcis clavier pour la page détail /task/:id.
 *
 * Mêmes lettres que la liste /tasks (consistance) :
 *   B/P/L/R/U/N/V → statut
 *   I / Shift+I   → importance ±10
 *   C / Shift+C   → complexité ±2
 *   D / Shift+D   → date prévue ±1j
 *   W / M / T / E → date prévue (+sem / +mois / aujourd'hui / effacer)
 *   1-9           → toggle tag (9 premiers)
 *   ` (Backquote) → sélecteur de tags (tous les tags, recherche)
 *   X             → Terminer (ouvre une confirmation)
 *   Ctrl+S        → sauvegarder (marche même dans un champ)
 *   Escape        → retour
 *
 * Les raccourcis sont inactifs quand le focus est dans un champ
 * (input / textarea / select / contentEditable), sauf Ctrl+S et Escape.
 * Si un modal (sélecteur de tags / confirmation) est ouvert, les raccourcis
 * globaux sont inactifs : le modal gère ses propres touches (Esc, Entrée…).
 */

const STATUS_KEYS: Record<string, TaskStatus> = {
  b: 'brouillon',
  p: 'pour_ia',
  l: 'collecte',
  r: 'pret',
  u: 'un_jour_peut_etre',
  n: 'ia_en_cours',
  v: 'termine_par_ia',
}

export interface TaskDetailFormState {
  name: string
  link: string
  importance: number
  complexity: number
  status: TaskStatus
  plannedDate: string
  dueDate: string
  tagIds: string[]
}

interface UseTaskDetailShortcutsProps {
  taskId: string
  form: TaskDetailFormState | null
  setForm: React.Dispatch<React.SetStateAction<TaskDetailFormState | null>>
  setBaseline: React.Dispatch<React.SetStateAction<TaskDetailFormState | null>>
  tags: Tag[]
  onSave: () => Promise<void>
  onBack: () => void
  isSaving: boolean
  /** Ouvre la confirmation « Terminer » (touche X). */
  onRequestComplete?: () => void
  /** Ouvre le sélecteur de tags (touche ` / Backquote). */
  onOpenTagPicker?: () => void
  /** Si un modal (picker / confirmation) est ouvert : désactiver les raccourcis globaux. */
  modalOpen?: boolean
}

/** Construit un objet Task minimal depuis l'état du formulaire (pour les fonctions shortcutActions). */
function buildTaskLike(form: TaskDetailFormState, taskId: string, tags: Tag[]): Task {
  return {
    id: taskId,
    name: form.name,
    importance: form.importance,
    complexity: form.complexity,
    status: form.status,
    plannedDate: form.plannedDate || undefined,
    dueDate: form.dueDate || undefined,
    position: 0,
    userId: '',
    isCompleted: false,
    createdAt: '',
    updatedAt: '',
    subtasks: [],
    tags: tags.filter((t) => form.tagIds.includes(t.id)),
  }
}

export function useTaskDetailShortcuts({
  taskId,
  form,
  setForm,
  setBaseline,
  tags,
  onSave,
  onBack,
  isSaving,
  onRequestComplete,
  onOpenTagPicker,
  modalOpen,
}: UseTaskDetailShortcutsProps) {
  // Refs pour éviter de ré-enregistrer le listener à chaque render
  const formRef = useRef(form)
  const tagsRef = useRef(tags)
  const isSavingRef = useRef(isSaving)
  const onSaveRef = useRef(onSave)
  const onBackRef = useRef(onBack)
  const onRequestCompleteRef = useRef(onRequestComplete)
  const onOpenTagPickerRef = useRef(onOpenTagPicker)
  const modalOpenRef = useRef(modalOpen)

  formRef.current = form
  tagsRef.current = tags
  isSavingRef.current = isSaving
  onSaveRef.current = onSave
  onBackRef.current = onBack
  onRequestCompleteRef.current = onRequestComplete
  onOpenTagPickerRef.current = onOpenTagPicker
  modalOpenRef.current = modalOpen

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Un modal (sélecteur de tags / confirmation) est ouvert : il gère ses
      // propres touches (Esc, Entrée, flèches) — on ne fait rien ici.
      if (modalOpenRef.current) return

      const target = e.target as HTMLElement
      const inField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true'

      // ── Ctrl+S : sauvegarder (marche partout, y compris dans un champ) ──
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!isSavingRef.current) {
          await onSaveRef.current()
        }
        return
      }

      // ── Escape : retour ──
      if (e.key === 'Escape') {
        e.preventDefault()
        onBackRef.current()
        return
      }

      // Les autres raccourcis : inactifs dans un champ ou pendant un save
      if (inField || isSavingRef.current) return

      const currentForm = formRef.current
      if (!currentForm) return

      const currentTags = tagsRef.current

      // ── Sélecteur de tags : ` (Backquote) ──
      // e.code = position PHYSIQUE de la touche → indépendant du layout
      // (AZERTY / QWERTY). Sur AZERTY cette touche est l'apostrophe.
      if (e.code === 'Backquote') {
        e.preventDefault()
        onOpenTagPickerRef.current?.()
        return
      }

      /** Applique un update : form + baseline + API, revert si échec. */
      const applyUpdate = async (
        apiUpdate: Partial<UpdateTaskData>,
        formUpdate: Partial<TaskDetailFormState>
      ) => {
        const prevForm = { ...currentForm }
        const newForm = { ...currentForm, ...formUpdate }
        setForm(newForm)
        setBaseline(newForm)
        try {
          await api.updateTask(taskId, apiUpdate)
        } catch {
          setForm(prevForm)
          setBaseline(prevForm)
        }
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase()

        // ── Statuts : B / P / L / R / U / N / V ──
        const status = STATUS_KEYS[key]
        if (status) {
          e.preventDefault()
          if (currentForm.status !== status) {
            await applyUpdate({ status }, { status })
          }
          return
        }

        // ── Importance : I (+10) / Shift+I (−10) ──
        if (key === 'i') {
          e.preventDefault()
          const taskLike = buildTaskLike(currentForm, taskId, currentTags)
          const update = computeImportanceUpdate(taskLike, e.shiftKey ? 'down' : 'up')
          if (update.importance !== undefined) {
            await applyUpdate(update, { importance: update.importance })
          }
          return
        }

        // ── Complexité : C (+2) / Shift+C (−2) ──
        if (key === 'c') {
          e.preventDefault()
          const taskLike = buildTaskLike(currentForm, taskId, currentTags)
          const update = computeComplexityUpdate(taskLike, e.shiftKey ? 'down' : 'up')
          if (update.complexity !== undefined) {
            await applyUpdate(update, { complexity: update.complexity })
          }
          return
        }

        // ── Dates : D / Shift+D / W / M / T / E ──
        let dateOp: DateShiftOp | null = null
        if (key === 'd') dateOp = e.shiftKey ? 'yesterday' : 'tomorrow'
        else if (key === 'w') dateOp = 'week'
        else if (key === 'm') dateOp = 'month'
        else if (key === 't') dateOp = 'today'
        else if (key === 'e') dateOp = 'remove'

        if (dateOp) {
          e.preventDefault()
          const taskLike = buildTaskLike(currentForm, taskId, currentTags)
          const update = computeDateUpdate(taskLike, dateOp)
          if (update.plannedDate !== undefined) {
            const plannedDate = update.plannedDate ?? ''
            const dueDate =
              dateOp === 'remove'
                ? ''
                : (TaskDateConsistencyService.alignDueDateWithPlannedDate(
                    plannedDate || null,
                    currentForm.dueDate || null
                  ) ?? '')
            const apiUpdate = withDateConsistency(update, taskLike)
            await applyUpdate(apiUpdate, { plannedDate, dueDate })
          }
          return
        }

        // ── Tags : 1-9 (9 premiers) ──
        if (/^[1-9]$/.test(e.key)) {
          e.preventDefault()
          const tag = currentTags[parseInt(e.key, 10) - 1]
          if (tag) {
            const taskLike = buildTaskLike(currentForm, taskId, currentTags)
            const update = toggleTagUpdate(taskLike, tag)
            if (update.tagIds) {
              await applyUpdate(update, { tagIds: update.tagIds })
            }
          }
          return
        }

        // ── Terminer : X (ouvre la confirmation) ──
        if (key === 'x') {
          e.preventDefault()
          onRequestCompleteRef.current?.()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [taskId, setForm, setBaseline])
}
