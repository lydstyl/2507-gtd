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
 * Panneau gauche = famille Ctrl+Alt (actifs MÊME pendant la frappe dans la
 * note ou un autre champ — décision Gabriel 11/2026, sinon « p » s'écrase
 * dans le texte au lieu de changer le statut) :
 *   Ctrl+Alt+B/P/L/R/U/N/V → statut (sauvegarde complète auto : note + tous les champs)
 *   Ctrl+Alt+I / +Shift+I  → importance ±10
 *   Ctrl+Alt+C / +Shift+C  → complexité ±2
 *   Ctrl+Alt+D / +Shift+D  → date prévue ±1j
 *   Ctrl+Alt+W / M / T / E → date prévue (+sem / +mois / aujourd'hui / effacer)
 *   Ctrl+Alt+1-9           → toggle tag (9 premiers)
 *   Ctrl+Alt+A             → sélecteur de tags (tous les tags, recherche) · alias ` hors champ
 *   Ctrl+Alt+X             → Terminer (ouvre une confirmation)
 *
 * Les touches sont testées sur e.code (touche PHYSIQUE, identique AZERTY /
 * QWERTY) — sur AZERTY, Ctrl+Alt+lettre produit des caractères spéciaux dans
 * e.key, inutilisable. AltGr (Ctrl+Alt sur certaines dispositions) est accepté.
 *
 * Toujours hors modificateurs :
 *   Ctrl+S → sauvegarder (marche même dans un champ)
 *   Escape → retour
 *   H      → aide raccourcis (géré par la page, hors champ)
 *
 * Conflit avec la note : le NoteEditor gère ses propres Ctrl+Alt (titres
 * 1-3, Réponse, flèches, mode lecture) et stoppe la propagation quand il les
 * traite → ici on ignore tout événement déjà defaultPrevented.
 * Si un modal (sélecteur de tags / confirmation) est ouvert, les raccourcis
 * globaux sont inactifs : le modal gère ses propres touches (Esc, Entrée…).
 */

/** Codes PHYSIQUES des lettres de statut (AZERTY/QWERTY indifférents). */
const STATUS_KEYS: Record<string, TaskStatus> = {
  KeyB: 'brouillon',
  KeyP: 'pour_ia',
  KeyL: 'collecte',
  KeyR: 'pret',
  KeyU: 'un_jour_peut_etre',
  KeyN: 'ia_en_cours',
  KeyV: 'termine_par_ia',
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
  /**
   * Sauvegarde complète (tâche + note). Peut recevoir l'état de formulaire
   * fraîchement modifié (avant commit de setForm) — utilisé par le raccourci
   * de statut qui doit tout sauvegarder, pas seulement le statut.
   * Retourne false en cas d'échec (→ revert).
   */
  onSave: (formOverride?: TaskDetailFormState) => Promise<boolean | void>
  onBack: () => void
  isSaving: boolean
  /** Ouvre la confirmation « Terminer » (Ctrl+Alt+X). */
  onRequestComplete?: () => void
  /** Ouvre le sélecteur de tags (Ctrl+Alt+A — alias ` hors champ). */
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
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') {
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

      // ── Famille Ctrl+Alt : les raccourcis du panneau gauche ──
      // Actifs MÊME dans un champ de saisie (note comprise). AltGr = Ctrl+Alt
      // sur certaines dispositions → AltRight accepté à la place du Ctrl.
      const isPanelCombo =
        (e.ctrlKey && e.altKey) || (e.altKey && e.code === 'AltRight') || (e.metaKey && e.altKey)
      if (!isPanelCombo) {
        // Alias silencieux hors champ : ` ouvre le sélecteur de tags.
        if (e.code === 'Backquote' && !inField && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          onOpenTagPickerRef.current?.()
        }
        return
      }
      // Le NoteEditor a déjà traité ce Ctrl+Alt (titres, Réponse…) → pas de doublon.
      if (e.defaultPrevented) return
      if (isSavingRef.current) return

      const currentForm = formRef.current
      if (!currentForm) return

      const currentTags = tagsRef.current

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

      const code = e.code

      // ── Sélecteur de tags : Ctrl+Alt+A ──
      if (code === 'KeyA') {
        e.preventDefault()
        onOpenTagPickerRef.current?.()
        return
      }

      // ── Statuts : Ctrl+Alt+B / P / L / R / U / N / V ──
      const status = STATUS_KEYS[code]
      if (status && !e.shiftKey) {
        e.preventDefault()
        if (currentForm.status !== status) {
          // Sauvegarde COMPLÈTE (note + tous les champs modifiés), pas
          // seulement le statut — cohérent avec le select de la page.
          const prevForm = { ...currentForm }
          const newForm = { ...currentForm, status }
          setForm(newForm)
          setBaseline(newForm)
          const ok = await onSaveRef.current(newForm)
          if (ok === false) {
            setForm(prevForm)
            setBaseline(prevForm)
          }
        }
        return
      }

      // ── Importance : Ctrl+Alt+I (+10) / Ctrl+Alt+Shift+I (−10) ──
      if (code === 'KeyI') {
        e.preventDefault()
        const taskLike = buildTaskLike(currentForm, taskId, currentTags)
        const update = computeImportanceUpdate(taskLike, e.shiftKey ? 'down' : 'up')
        if (update.importance !== undefined) {
          await applyUpdate(update, { importance: update.importance })
        }
        return
      }

      // ── Complexité : Ctrl+Alt+C (+2) / Ctrl+Alt+Shift+C (−2) ──
      if (code === 'KeyC') {
        e.preventDefault()
        const taskLike = buildTaskLike(currentForm, taskId, currentTags)
        const update = computeComplexityUpdate(taskLike, e.shiftKey ? 'down' : 'up')
        if (update.complexity !== undefined) {
          await applyUpdate(update, { complexity: update.complexity })
        }
        return
      }

      // ── Dates : Ctrl+Alt+D / +Shift+D / W / M / T / E ──
      let dateOp: DateShiftOp | null = null
      if (code === 'KeyD') dateOp = e.shiftKey ? 'yesterday' : 'tomorrow'
      else if (code === 'KeyW') dateOp = 'week'
      else if (code === 'KeyM') dateOp = 'month'
      else if (code === 'KeyT') dateOp = 'today'
      else if (code === 'KeyE') dateOp = 'remove'

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

      // ── Tags : Ctrl+Alt+1-9 (9 premiers) ──
      // (Ctrl+Alt+1/2/3 dans la note = titres — le NoteEditor les traite en
      // premier et stoppe la propagation, donc ici seulement hors note.)
      const digitMatch = /^Digit([1-9])$/.exec(code)
      if (digitMatch && !e.shiftKey) {
        e.preventDefault()
        const tag = currentTags[parseInt(digitMatch[1], 10) - 1]
        if (tag) {
          const taskLike = buildTaskLike(currentForm, taskId, currentTags)
          const update = toggleTagUpdate(taskLike, tag)
          if (update.tagIds) {
            await applyUpdate(update, { tagIds: update.tagIds })
          }
        }
        return
      }

      // ── Terminer : Ctrl+Alt+X (ouvre la confirmation) ──
      if (code === 'KeyX' && !e.shiftKey) {
        e.preventDefault()
        onRequestCompleteRef.current?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [taskId, setForm, setBaseline])
}
