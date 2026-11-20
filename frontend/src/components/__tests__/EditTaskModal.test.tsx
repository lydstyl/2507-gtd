import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditTaskModal } from '../EditTaskModal'
import type { Task } from '../../types/task'

// Mock de l'api (getTags / updateTask) pour éviter tout réseau en jsdom.
vi.mock('../utils/api', () => ({
  api: {
    getTags: vi.fn(async () => []),
    updateTask: vi.fn(async () => {}),
  },
  ApiError: class ApiError extends Error {},
}))

const baseTask: Task = {
  id: 'task-1',
  name: 'Tâche avec note',
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

const noop = () => {}

describe('EditTaskModal — bouton "Retour à la note"', () => {
  it('visible quand onOpenNote fourni et tâche avec note', () => {
    render(
      <EditTaskModal
        task={{ ...baseTask, hasNote: true }}
        isOpen
        onClose={noop}
        onTaskUpdated={noop}
        onOpenNote={noop}
      />
    )
    expect(screen.getByText('Retour à la note')).toBeInTheDocument()
  })

  it('absent si onOpenNote non fourni', () => {
    render(
      <EditTaskModal
        task={{ ...baseTask, hasNote: true }}
        isOpen
        onClose={noop}
        onTaskUpdated={noop}
      />
    )
    expect(screen.queryByText('Retour à la note')).not.toBeInTheDocument()
  })

  it("visible même si la tâche n'a pas de note (pour en créer une)", () => {
    render(
      <EditTaskModal
        task={{ ...baseTask, hasNote: false }}
        isOpen
        onClose={noop}
        onTaskUpdated={noop}
        onOpenNote={noop}
      />
    )
    expect(screen.getByText('Retour à la note')).toBeInTheDocument()
  })

  it('clic : appelle onOpenNote avec la tâche', async () => {
    const onOpenNote = vi.fn()
    const task = { ...baseTask, hasNote: true }
    render(
      <EditTaskModal
        task={task}
        isOpen
        onClose={noop}
        onTaskUpdated={noop}
        onOpenNote={onOpenNote}
      />
    )
    await userEvent.click(screen.getByText('Retour à la note'))
    expect(onOpenNote).toHaveBeenCalledWith(task)
  })
})
