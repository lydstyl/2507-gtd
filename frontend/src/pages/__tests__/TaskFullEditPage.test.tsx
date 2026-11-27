import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * Régression 27/11/2026 — « je ne peux pas changer les dates d'une tâche ».
 *
 * Le bouton « Sauvegarder » était câblé `onClick={handleSave}` : React passait
 * l'événement de clic en 1er argument, pris pour un `formOverride` →
 * `JSON.stringify(event)` levait « Converting circular structure to JSON » →
 * bandeau « Une erreur inattendue s'est produite », aucun PUT envoyé, dates
 * perdues. Ces tests passent par le VRAI bouton de la page : ils échouent si
 * quelqu'un recâble `onClick={handleSave}` sans garde.
 */

const updateTaskMutate = vi.fn()
const updateNoteMutate = vi.fn()

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'task-1' }),
  useNavigate: () => vi.fn(),
}))

const task = {
  id: 'task-1',
  name: 'Tâche test',
  link: '',
  note: '',
  hasNote: false,
  importance: 300,
  complexity: 3,
  position: 10000,
  status: 'brouillon',
  plannedDate: null,
  dueDate: null,
  isCompleted: false,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  parentId: null,
  userId: 'user-1',
  subtasks: [],
  tags: [],
}

vi.mock('../../hooks/useTasks', () => ({
  useTask: () => ({ data: task, isLoading: false, error: null }),
  useUpdateTask: () => ({ mutateAsync: updateTaskMutate, isPending: false }),
  useUpdateTaskNote: () => ({ mutateAsync: updateNoteMutate, isPending: false }),
}))

vi.mock('../../utils/api', async () => {
  class ApiError extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  }
  return {
    ApiError,
    api: {
      getTags: vi.fn().mockResolvedValue([{ id: 'tag-1', name: 'Maison', color: null }]),
    },
  }
})

import { TaskFullEditPage } from '../TaskFullEditPage'

describe('TaskFullEditPage — sauvegarde des dates', () => {
  beforeEach(() => {
    updateTaskMutate.mockReset().mockResolvedValue({ ...task })
    updateNoteMutate.mockReset().mockResolvedValue({ ...task })
  })

  it('enregistre la date prévue saisie via le bouton « Sauvegarder »', async () => {
    render(<TaskFullEditPage />)

    const plannedInput = document.querySelector('#plannedDate')!
    fireEvent.change(plannedInput, { target: { value: '2026-12-01' } })
    fireEvent.change(document.querySelector('#dueDate')!, {
      target: { value: '2026-12-05' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Sauvegarder/i }))

    await waitFor(() => expect(updateTaskMutate).toHaveBeenCalledTimes(1))
    const payload = updateTaskMutate.mock.calls[0][0]
    expect(payload.id).toBe('task-1')
    expect(payload.data.plannedDate).toBe('2026-12-01')
    expect(payload.data.dueDate).toBe('2026-12-05')
    expect(payload.data.name).toBe('Tâche test')

    // Aucun bandeau d'erreur : c'est le symptôme exact du bug
    await waitFor(() => expect(screen.queryByText(/erreur inattendue/i)).toBeNull())
  })

  it('ne sauvegarde rien de corrompu quand aucune date n’a changé (bouton désactivé)', () => {
    render(<TaskFullEditPage />)
    const button = screen.getByRole('button', { name: /Sauvegarder/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(updateTaskMutate).not.toHaveBeenCalled()
  })
})
