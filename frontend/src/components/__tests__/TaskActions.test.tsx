import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TaskActions } from '../TaskActions'
import type { Task } from '../../types/task'

const baseTask: Task = {
  id: 'task-1',
  name: 'Tâche test',
  importance: 300,
  complexity: 3,
  position: 0,
  status: 'brouillon',
  userId: 'user-1',
  isCompleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  subtasks: [],
  tags: [],
}

/**
 * Le split des notes API retire `note` des réponses de liste. Les badges
 * doivent s'appuyer sur le flag léger `hasNote` (et non sur le contenu).
 */
describe('TaskActions — badge note basé sur hasNote', () => {
  it('affiche "Modifier la note" et le point violet quand hasNote est true (sans note chargée)', () => {
    const task: Task = { ...baseTask, hasNote: true, note: undefined }
    render(
      <MemoryRouter>
        <TaskActions task={task} onEditNote={() => {}} />
      </MemoryRouter>
    )

    const noteButton = screen.getByTitle('Modifier la note')
    expect(noteButton).toBeInTheDocument()
    // Le petit point indicateur (div absolute avec bg-purple-600)
    expect(noteButton.querySelector('.bg-purple-600')).not.toBeNull()
  })

  it('affiche "Ajouter une note" sans point quand hasNote est false', () => {
    const task: Task = { ...baseTask, hasNote: false, note: undefined }
    render(
      <MemoryRouter>
        <TaskActions task={task} onEditNote={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByTitle('Ajouter une note')).toBeInTheDocument()
    const addButton = screen.getByTitle('Ajouter une note')
    expect(addButton.querySelector('.bg-purple-600')).toBeNull()
  })

  it('gère le cas défensif hasNote absent (comportement hérité)', () => {
    // Ancien client / données sans hasNote : on retombe sur "Ajouter une note"
    const task: Task = { ...baseTask, note: '<p>note héritée</p>' }
    render(
      <MemoryRouter>
        <TaskActions task={task} onEditNote={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByTitle('Ajouter une note')).toBeInTheDocument()
  })
})

/**
 * Deux boutons « ouvrir » : la tâche s'ouvre soit dans la fenêtre en cours
 * (navigation SPA), soit dans un nouvel onglet. Les deux doivent rester
 * visibles et cliquables (demande Gabriel 27/11).
 */
describe('TaskActions — boutons ouvrir (même fenêtre + nouvel onglet)', () => {
  it('affiche « Ouvrir » (même fenêtre) et « Nouvel onglet » avec leurs libellés', () => {
    render(
      <MemoryRouter>
        <TaskActions task={baseTask} onEditNote={() => {}} />
      </MemoryRouter>
    )

    const sameWindow = screen.getByTitle('Ouvrir la tâche dans la fenêtre en cours (raccourci O)')
    const newTab = screen.getByTitle('Ouvrir la tâche dans un nouvel onglet')
    expect(sameWindow).toBeInTheDocument()
    expect(newTab).toBeInTheDocument()
    expect(screen.getByText('Ouvrir')).toBeInTheDocument()
    expect(screen.getByText('Nouvel onglet')).toBeInTheDocument()
  })
})
