import { useEffect, useRef } from 'react'
 import type { Task, Tag, TaskStatus, UpdateTaskData } from '../types/task'
import { api } from '../utils/api'
import {
  computeImportanceUpdate,
  computeComplexityUpdate,
  computeDateUpdate,
  computeStatusUpdate,
  toggleTagUpdate,
  withDateConsistency,
} from '../utils/shortcutActions'

/**
 * Raccourcis « statuts » — une lettre par statut. Fonctionnent sur la tâche
 * sélectionnée de la liste /tasks, et aussi pendant la LECTURE de la note
 * (modal note ouvert, focus hors de l'éditeur).
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


interface UseKeyboardShortcutsProps {
  filteredTasks: Task[]
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  tasks: Task[]
  tags: Tag[]
  isModalOpen: boolean
  isNoteModalOpen: boolean
  noteTaskId: string | null
  onTaskDeleted: (taskId: string) => Promise<void>
  onTasksReload: () => Promise<void>
  setPinnedTaskId: (id: string | null | ((prev: string | null) => string | null)) => void
  setShowShortcutsHelp: (show: boolean | ((prev: boolean) => boolean)) => void
  setFocusTaskId: (id: string | null) => void
  applyFilters: (tasks: Task[]) => Task[]
}

function findTaskById(tasks: Task[], id: string | null): Task | undefined {
  for (const t of tasks) {
    if (t.id === id) return t
    if (t.subtasks && t.subtasks.length > 0) {
      const found = findTaskById(t.subtasks, id)
      if (found) return found
    }
  }
  return undefined
}

export function useKeyboardShortcuts({
  filteredTasks,
  selectedTaskId,
  setSelectedTaskId,
  tasks,
  tags,
  isModalOpen,
  isNoteModalOpen,
  noteTaskId,
  onTaskDeleted,
  onTasksReload,
  setPinnedTaskId,
  setShowShortcutsHelp,
  setFocusTaskId,
  applyFilters
}: UseKeyboardShortcutsProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true'

      // Statuts (B/P/L/R/U/V) — sur la tâche sélectionnée de la liste, et
      // aussi pendant la LECTURE de la note (modal note ouvert, focus hors de
      // l'éditeur). Si le focus est DANS l'éditeur de la note, les lettres
      // tapent du texte : on n'intercepte pas.
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const status = STATUS_KEYS[e.key.toLowerCase()]
        if (status) {
          const readingNote = isNoteModalOpen && !!noteTaskId && !inField
          const onList = !isModalOpen && !inField
          if (readingNote || onList) {
            e.preventDefault()
            const targetId = readingNote ? noteTaskId : selectedTaskId
            if (targetId) {
              const targetTask = findTaskById(tasks, targetId)
              if (targetTask) {
                const update = computeStatusUpdate(targetTask, status)
                if (Object.keys(update).length > 0) {
                  try {
                    await api.updateTask(targetTask.id, update)
                    await onTasksReload()
                  } catch {
                    alert('Erreur lors du changement de statut de la tâche')
                  }
                }
              }
            }
            return
          }
        }
      }

      // Disable shortcuts if modal is open
      if (isModalOpen) return

      // Disable shortcuts if user is typing in input fields
      if (inField) {
        return
      }

      if (filteredTasks.length === 0 && !selectedTaskId) return

      // Navigation ↑/↓
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        const idx = filteredTasks.findIndex((t) => t.id === selectedTaskId)
        if (e.key === "ArrowDown") {
          if (idx === -1 || idx === filteredTasks.length - 1) {
            setSelectedTaskId(filteredTasks[0].id)
          } else {
            setSelectedTaskId(filteredTasks[idx + 1].id)
          }
        } else if (e.key === "ArrowUp") {
          if (idx === -1 || idx === 0) {
            setSelectedTaskId(filteredTasks[filteredTasks.length - 1].id)
          } else {
            setSelectedTaskId(filteredTasks[idx - 1].id)
          }
        }
        return
      }

      // Toggle help (H)
      if (e.key.toLowerCase() === "h") {
        e.preventDefault()
        setShowShortcutsHelp((v) => !v)
        return
      }

      // Toggle pinned task (F)
      if (e.key.toLowerCase() === "f") {
        e.preventDefault()
        if (!selectedTaskId) return
        setPinnedTaskId((prev: string | null) => (prev === selectedTaskId ? null : selectedTaskId))
        return
      }

      // Open selected task in a new tab (O) — page plein écran /task/:id
      // (même URL que le bouton « nouvel onglet » des cartes)
      if (e.key.toLowerCase() === "o") {
        e.preventDefault()
        if (!selectedTaskId) return
        window.open(`/task/${selectedTaskId}`, "_blank")
        return
      }

      // Quick edit shortcuts - only if a task is selected
      if (!selectedTaskId) return
      const task = findTaskById(tasks, selectedTaskId)
      if (!task) return
       let update: Partial<Pick<UpdateTaskData, 'importance' | 'complexity' | 'plannedDate' | 'dueDate' | 'tagIds'>> = {}
      let handled = false

      // Delete selected task (Delete)
      if (e.key === 'Delete') {
        e.preventDefault()
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.name}" ? Cette action est irréversible.`)) {
          await onTaskDeleted(selectedTaskId)
        }
        return
      }

      // Importance (I: +10, Shift+I: -10)
      if (e.key.toLowerCase() === "i") {
        e.preventDefault()
        Object.assign(update, computeImportanceUpdate(task, e.shiftKey ? 'down' : 'up'))
        handled = true
      }

      // Complexity (C: +2, Shift+C: -2)
      if (e.key.toLowerCase() === "c") {
        e.preventDefault()
        Object.assign(update, computeComplexityUpdate(task, e.shiftKey ? 'down' : 'up'))
        handled = true
      }

       // Due date +1j/-1j
       if (e.key.toLowerCase() === "d") {
         e.preventDefault()
         Object.assign(update, computeDateUpdate(task, e.shiftKey ? 'yesterday' : 'tomorrow'))
         handled = true
       }

        // Due date +1 week
        if (e.key.toLowerCase() === "w") {
          e.preventDefault()
          Object.assign(update, computeDateUpdate(task, 'week'))
          handled = true
        }

        // Due date +1 month
        if (e.key.toLowerCase() === "m") {
          e.preventDefault()
          Object.assign(update, computeDateUpdate(task, 'month'))
          handled = true
        }

        // Set date to today (T)
        if (e.key.toLowerCase() === "t") {
          e.preventDefault()
          Object.assign(update, computeDateUpdate(task, 'today'))
          handled = true
        }

      // Remove date (E)
      if (e.key.toLowerCase() === "e") {
        e.preventDefault()
        Object.assign(update, computeDateUpdate(task, 'remove'))
        handled = true
      }

      // Tags 1-9
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const tag = tags[parseInt(e.key, 10) - 1]
        if (tag) {
          Object.assign(update, toggleTagUpdate(task, tag))
          handled = true
        }
      }

      if (handled) {
        try {
          // Règle « date limite ≥ date prévue » : réalignée si la date prévue change
          // (logique partagée clavier + boutons via shortcutActions).
          const finalUpdate = withDateConsistency(update, task)

          await api.updateTask(task.id, finalUpdate)
          await onTasksReload()
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            const stillVisible = applyFilters(tasks).some((t) => t.id === task.id)
            if (!stillVisible) {
              setFocusTaskId(task.id)
            } else {
              setFocusTaskId(null)
            }
          }, 300)
         } catch {
           alert("Erreur lors de la modification rapide de la tâche")
         }
        return
      }

      // Mark task as done/undone (Space)
      if (e.key === " ") {
        e.preventDefault()
        try {
          if (task.isCompleted) {
            await api.updateTask(task.id, { isCompleted: false })
          } else {
            await api.markTaskCompleted(task.id)
          }
          await onTasksReload()
         } catch {
           alert("Erreur lors de la modification du statut de la tâche")
         }
        return
      }

      // Set all overdue tasks to today (A)
      if (e.key.toLowerCase() === "a") {
        e.preventDefault()
        if (!window.confirm("Mettre toutes les tâches en retard à aujourd'hui ?")) return
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueTasks = tasks.filter(t => t.plannedDate && new Date(t.plannedDate) < today)
        const todayFormatted = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0')
        for (const t of overdueTasks) {
          await api.updateTask(t.id, { plannedDate: todayFormatted })
        }
        await onTasksReload()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    filteredTasks,
    selectedTaskId,
    tasks,
    tags,
    isModalOpen,
    isNoteModalOpen,
    noteTaskId,
    onTaskDeleted,
    onTasksReload,
    setPinnedTaskId,
    setShowShortcutsHelp,
    setFocusTaskId,
    applyFilters,
    setSelectedTaskId
  ])
}