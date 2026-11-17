import { describe, it, expect } from 'vitest'
import type { Task, Tag } from '../../types/task'
import {
  computeImportanceUpdate,
  computeComplexityUpdate,
  computeDateUpdate,
  computeStatusUpdate,
  toggleTagUpdate,
  withDateConsistency,
} from '../shortcutActions'

// Tâche de référence (champs utilisés par les handlers)
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Tâche test',
    importance: 300,
    complexity: 3,
    plannedDate: '2026-11-16',
    dueDate: null,
    tags: [],
    ...overrides,
  } as Task
}

// Tag complet (FrontendTag + position) pour satisf aire le type
function makeTag(id: string, name: string): Tag {
  return {
    id,
    name,
    color: '#6b7280',
    position: 1,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  } as Tag
}

describe('computeImportanceUpdate', () => {
  it("incrémente (+10) et borne à 499", () => {
    expect(computeImportanceUpdate(makeTask({ importance: 490 }), 'up').importance).toBe(499)
    expect(computeImportanceUpdate(makeTask({ importance: 300 }), 'up').importance).toBe(310)
  })

  it("décrémente (-10) et borne à 100", () => {
    expect(computeImportanceUpdate(makeTask({ importance: 110 }), 'down').importance).toBe(100)
    expect(computeImportanceUpdate(makeTask({ importance: 300 }), 'down').importance).toBe(290)
  })
})

describe('computeComplexityUpdate', () => {
  it("incrémente (+2) et borne à 9", () => {
    expect(computeComplexityUpdate(makeTask({ complexity: 8 }), 'up').complexity).toBe(9)
    expect(computeComplexityUpdate(makeTask({ complexity: 3 }), 'up').complexity).toBe(5)
  })

  it("décrémente (-2) et borne à 1", () => {
    expect(computeComplexityUpdate(makeTask({ complexity: 2 }), 'down').complexity).toBe(1)
    expect(computeComplexityUpdate(makeTask({ complexity: 5 }), 'down').complexity).toBe(3)
  })
})

describe('computeDateUpdate', () => {
  it("gère 'remove' (plannedDate à null)", () => {
    expect(computeDateUpdate(makeTask(), 'remove').plannedDate).toBeNull()
  })

  it("gère 'today' (plannedDate = aujourd'hui)", () => {
    const update = computeDateUpdate(makeTask(), 'today')
    const today = new Date()
    const expected =
      today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')
    expect(update.plannedDate).toBe(expected)
  })

  it("gère '+1 jour' à partir de la date courante", () => {
    const update = computeDateUpdate(makeTask({ plannedDate: '2026-11-16' }), 'tomorrow')
    expect(update.plannedDate).toBe('2026-11-17')
  })

  it("gère '+1 semaine' et '+1 mois'", () => {
    expect(computeDateUpdate(makeTask({ plannedDate: '2026-11-16' }), 'week').plannedDate).toBe(
      '2026-11-23'
    )
    expect(computeDateUpdate(makeTask({ plannedDate: '2026-11-16' }), 'month').plannedDate).toBe(
      '2026-12-16'
    )
  })
})

describe('toggleTagUpdate', () => {
  it("ajoute le tag si absent (retourne tagIds)", () => {
    const tag = makeTag('t1', 'Work')
    const update = toggleTagUpdate(makeTask(), tag)
    expect(update.tagIds).toEqual(['t1'])
  })

  it("retire le tag si présent (retourne tagIds)", () => {
    const tag = makeTag('t1', 'Work')
    const task = makeTask({ tags: [makeTag('t1', 'Work')] })
    const update = toggleTagUpdate(task, tag)
    expect(update.tagIds).toEqual([])
  })

  it("préserve les autres tags au toggle", () => {
    const other = makeTag('t0', 'Home')
    const target = makeTag('t2', 'Work')
    const task = makeTask({ tags: [other] })
    const update = toggleTagUpdate(task, target)
    expect(update.tagIds).toContain('t0')
    expect(update.tagIds).toContain('t2')
  })
})

describe('computeStatusUpdate', () => {
  it('retourne { status } quand le statut change', () => {
    const update = computeStatusUpdate(makeTask({ status: 'brouillon' }), 'pour_ia')
    expect(update).toEqual({ status: 'pour_ia' })
  })

  it("retourne un update vide si le statut est déjà celui demandé", () => {
    const update = computeStatusUpdate(makeTask({ status: 'pour_ia' }), 'pour_ia')
    expect(update).toEqual({})
  })
})

describe('withDateConsistency', () => {
  it("aligne dueDate sur plannedDate si elle est antérieure", () => {
    const task = makeTask({ plannedDate: '2026-12-01', dueDate: '2026-11-01' })
    const update = withDateConsistency({ plannedDate: '2026-12-01' }, task)
    // La dueDate (11/01) est antérieure à la nouvelle plannedDate (12/01) → alignée
    expect(update.dueDate).toBe('2026-12-01')
  })

  it("ne touche pas à dueDate si elle est postérieure (update minimal, pas de dueDate)", () => {
    const task = makeTask({ plannedDate: '2026-11-01', dueDate: '2026-12-15' })
    const update = withDateConsistency({ plannedDate: '2026-11-01' }, task)
    // dueDate déjà postérieure → pas besoin de la persister dans l'update
    expect(update.dueDate).toBeUndefined()
  })
})
