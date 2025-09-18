import { useEffect } from 'react'
import type { Task, Tag } from '../types/task'
import { api } from '../utils/api'

interface UseKeyboardShortcutsProps {
  filteredTasks: Task[]
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  tasks: Task[]
  tags: Tag[]
  isModalOpen: boolean
  onTaskDeleted: (taskId: string) => Promise<void>
  onTasksReload: () => Promise<void>
  setPinnedTaskId: (id: string | null) => void
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
  onTaskDeleted,
  onTasksReload,
  setPinnedTaskId,
  setShowShortcutsHelp,
  setFocusTaskId,
  applyFilters
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Disable shortcuts if modal is open
      if (isModalOpen) return

      // Disable shortcuts if user is typing in input fields
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.contentEditable === 'true') {
        return
      }

      if (filteredTasks.length === 0 && !selectedTaskId) return

      // Navigation ↑/↓
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        let idx = filteredTasks.findIndex((t) => t.id === selectedTaskId)
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
        setPinnedTaskId((prev) => (prev === selectedTaskId ? null : selectedTaskId))
        return
      }

      // Quick edit shortcuts - only if a task is selected
      if (!selectedTaskId) return
      const task = findTaskById(tasks, selectedTaskId)
      if (!task) return
      let update: any = {}
      let handled = false

      // Delete selected task (Delete)
      if (e.key === 'Delete') {
        e.preventDefault()
        if (window.confirm('Supprimer cette tâche ?')) {
          await onTaskDeleted(selectedTaskId)
        }
        return
      }

      // Importance (I: +10, Shift+I: -10)
      if (e.key.toLowerCase() === "i") {
        e.preventDefault()
        if (e.shiftKey) {
          update.importance = Math.max(0, task.importance - 10)
        } else {
          update.importance = Math.min(50, task.importance + 10)
        }
        handled = true
      }

      // Complexity (C: +2, Shift+C: -2)
      if (e.key.toLowerCase() === "c") {
        e.preventDefault()
        if (e.shiftKey) {
          update.complexity = Math.max(1, task.complexity - 2)
        } else {
          update.complexity = Math.min(9, task.complexity + 2)
        }
        handled = true
      }

      // Due date +1j/-1j
      if (e.key.toLowerCase() === "d") {
        e.preventDefault()
        let baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        if (e.shiftKey) {
          baseDate.setDate(baseDate.getDate() - 1)
        } else {
          baseDate.setDate(baseDate.getDate() + 1)
        }
        // Format as YYYY-MM-DD to avoid timezone issues
        update.dueDate = baseDate.getFullYear() + '-' +
          String(baseDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(baseDate.getDate()).padStart(2, '0')
        handled = true
      }

      // Due date +1 week
      if (e.key.toLowerCase() === "w") {
        e.preventDefault()
        let baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        baseDate.setDate(baseDate.getDate() + 7)
        // Format as YYYY-MM-DD to avoid timezone issues
        update.dueDate = baseDate.getFullYear() + '-' +
          String(baseDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(baseDate.getDate()).padStart(2, '0')
        handled = true
      }

      // Due date +1 month
      if (e.key.toLowerCase() === "m") {
        e.preventDefault()
        let baseDate = task.dueDate ? new Date(task.dueDate) : new Date()
        baseDate.setMonth(baseDate.getMonth() + 1)
        // Format as YYYY-MM-DD to avoid timezone issues
        update.dueDate = baseDate.getFullYear() + '-' +
          String(baseDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(baseDate.getDate()).padStart(2, '0')
        handled = true
      }

      // Set date to today (T)
      if (e.key.toLowerCase() === "t") {
        e.preventDefault()
        const today = new Date()
        // Format as YYYY-MM-DD to avoid timezone issues
        update.dueDate = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0')
        handled = true
      }

      // Remove date (E)
      if (e.key.toLowerCase() === "e") {
        e.preventDefault()
        update.dueDate = null
        handled = true
      }

      // Tags 1-9
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const idx = parseInt(e.key, 10) - 1
        if (tags[idx]) {
          const tagId = tags[idx].id
          const hasTag = task.tags.some((t) => t.id === tagId)
          update.tagIds = hasTag
            ? task.tags.filter((t) => t.id !== tagId).map((t) => t.id)
            : [...task.tags.map((t) => t.id), tagId]
          handled = true
        }
      }

      if (handled) {
        try {
          await api.updateTask(task.id, update)
          await onTasksReload()
          setTimeout(() => {
            const stillVisible = applyFilters(tasks).some((t) => t.id === task.id)
            if (!stillVisible) {
              setFocusTaskId(task.id)
            } else {
              setFocusTaskId(null)
            }
          }, 300)
        } catch (err) {
          alert("Erreur lors de la modification rapide de la tâche")
        }
        return
      }

      // Set all overdue tasks to today (A)
      if (e.key.toLowerCase() === "a") {
        e.preventDefault()
        if (!window.confirm("Mettre toutes les tâches en retard à aujourd'hui ?")) return
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today)
        const todayFormatted = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0')
        for (const t of overdueTasks) {
          await api.updateTask(t.id, { dueDate: todayFormatted })
        }
        await onTasksReload()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    filteredTasks,
    selectedTaskId,
    tasks,
    tags,
    isModalOpen,
    onTaskDeleted,
    onTasksReload,
    setPinnedTaskId,
    setShowShortcutsHelp,
    setFocusTaskId,
    applyFilters,
    setSelectedTaskId
  ])
}