import type { Task, Tag, TaskStatus, UpdateTaskData } from '../types/task'
import { TaskDateConsistencyService } from '@gtd/shared'

/**
 * Handlers partagés « raccourcis → boutons ».
 *
 * Le clavier (useKeyboardShortcuts.ts) et les boutons (handleQuickAction dans
 * TaskListPage + QuickActionsMenu) appellent EXACTEMENT les mêmes fonctions
 * pures : zéro duplication de logique. Toute règle d'impact, de complexité,
 * de date ou de tag vit ici et un seul endroit.
 *
 * Spec : apps/2507-gtd-docker/docs/mobile-shortcut-buttons-spec.md
 */

/** Opérations de date prévues (clavier T/D/Shift+D/W/M/E = boutons). */
export type DateShiftOp =
  | 'today'
  | 'tomorrow'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'remove'

/** Format une Date en YYYY-MM-DD (fuseau local) — évite les décalages de fuseau. */
function toLocalISO(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

/** Importance +10 / −10 (bornes 100..499). Clavier (I / Shift+I) et boutons. */
export function computeImportanceUpdate(task: Task, dir: 'up' | 'down'): Partial<UpdateTaskData> {
  return {
    importance:
      dir === 'up' ? Math.min(499, task.importance + 10) : Math.max(100, task.importance - 10),
  }
}

/** Complexité +2 / −2 (bornes 1..9). Clavier (C / Shift+C) et boutons. */
export function computeComplexityUpdate(task: Task, dir: 'up' | 'down'): Partial<UpdateTaskData> {
  return {
    complexity: dir === 'up' ? Math.min(9, task.complexity + 2) : Math.max(1, task.complexity - 2),
  }
}

/**
 * Date prévue : aujourd'hui / +1j / −1j / +1 sem / +1 mois / retirer.
 * Base = date prévue existante, sinon aujourd'hui. Clavier (T/D/W/M/E) et boutons.
 */
export function computeDateUpdate(task: Task, op: DateShiftOp): Partial<UpdateTaskData> {
  if (op === 'today') return { plannedDate: toLocalISO(new Date()) }
  if (op === 'remove') return { plannedDate: null }

  const base = task.plannedDate ? new Date(task.plannedDate) : new Date()
  if (op === 'tomorrow') base.setDate(base.getDate() + 1)
  else if (op === 'yesterday') base.setDate(base.getDate() - 1)
  else if (op === 'week') base.setDate(base.getDate() + 7)
  else if (op === 'month') base.setMonth(base.getMonth() + 1)

  return { plannedDate: toLocalISO(base) }
}

/** Ajoute/retire un tag (toggle). Clavier (1-9) et boutons. */
export function toggleTagUpdate(task: Task, tag: Tag): Partial<UpdateTaskData> {
  const hasTag = task.tags.some((t) => t.id === tag.id)
  return {
    tagIds: hasTag
      ? task.tags.filter((t) => t.id !== tag.id).map((t) => t.id)
      : [...task.tags.map((t) => t.id), tag.id],
  }
}

/**
 * Change le statut de la tâche. Clavier (B/P/L/R/U/V). Retourne un update
 * vide si le statut est déjà celui demandé (aucun round-trap inutile).
 */
export function computeStatusUpdate(task: Task, status: TaskStatus): Partial<UpdateTaskData> {
  if (task.status === status) return {}
  return { status }
}

/**
 * Applique la règle « date limite ≥ date prévue » : si la date prévue change et
 * que la date limite deviendrait antérieure, elle est réalignée. Retourne
 * l'update final à persister. Partagé clavier + boutons.
 */
export function withDateConsistency(
  update: Partial<UpdateTaskData>,
  task: Task
): Partial<UpdateTaskData> {
  if (update.plannedDate === undefined) return update
  const alignedDueDate = TaskDateConsistencyService.alignDueDateWithPlannedDate(
    update.plannedDate,
    task.dueDate ?? null
  )
  if ((alignedDueDate ?? null) !== (task.dueDate ?? null)) {
    return { ...update, dueDate: alignedDueDate ?? null }
  }
  return update
}
