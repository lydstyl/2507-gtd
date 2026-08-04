import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteModal } from '../NoteModal'
import type { Task } from '../../types/task'

// Mock de l'éditeur TipTap (lourd à monter en jsdom) : on expose le contenu
// reçu pour vérifier que le lazy-load synchronise bien l'éditeur.
vi.mock('../NoteEditor', () => ({
  NoteEditor: ({ content }: { content: string }) => (
    <div data-testid="note-editor">{content}</div>
  ),
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

/**
 * Lazy-load des notes : le modal s'ouvre avec la version LISTE de la tâche
 * (hasNote=true, note absente), puis reçoit la version DÉTAIL (note présente)
 * via GET /api/tasks/:id. Le modal doit afficher un état de chargement puis
 * synchroniser l'éditeur — sinon on écraserait la note par une note vide.
 */
describe('NoteModal — lazy-load de la note', () => {
  it('affiche "Chargement de la note..." quand hasNote=true mais note pas encore chargée', () => {
    const task: Task = { ...baseTask, hasNote: true, note: undefined }
    render(<NoteModal task={task} isOpen onClose={noop} onSave={noop} />)

    expect(screen.getByText(/Chargement de la note/)).toBeInTheDocument()
    expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument()
  })

  it('synchronise l\'éditeur quand la note arrive après le fetch détail', () => {
    const { rerender } = render(
      <NoteModal
        task={{ ...baseTask, hasNote: true, note: undefined }}
        isOpen
        onClose={noop}
        onSave={noop}
      />
    )

    // La note n'est pas encore là → loading
    expect(screen.getByText(/Chargement de la note/)).toBeInTheDocument()

    // La réponse de GET /api/tasks/:id arrive → l'éditeur se remplit
    rerender(
      <NoteModal
        task={{ ...baseTask, hasNote: true, note: '<p>Ma note sauvegardée</p>' }}
        isOpen
        onClose={noop}
        onSave={noop}
      />
    )

    expect(screen.queryByText(/Chargement de la note/)).not.toBeInTheDocument()
    expect(screen.getByTestId('note-editor').textContent).toBe(
      '<p>Ma note sauvegardée</p>'
    )
  })

  it('tâche sans note : pas de loading, éditeur vide, pas de bouton supprimer', () => {
    const task: Task = { ...baseTask, hasNote: false, note: undefined }
    render(<NoteModal task={task} isOpen onClose={noop} onSave={noop} onDelete={noop} />)

    expect(screen.queryByText(/Chargement de la note/)).not.toBeInTheDocument()
    expect(screen.getByTestId('note-editor').textContent).toBe('')
    expect(screen.queryByText('Supprimer la note')).not.toBeInTheDocument()
  })

  it('tâche avec note chargée : bouton "Supprimer la note" visible', () => {
    const task: Task = { ...baseTask, hasNote: true, note: '<p>Contenu</p>' }
    render(<NoteModal task={task} isOpen onClose={noop} onSave={noop} onDelete={noop} />)

    expect(screen.getByText('Supprimer la note')).toBeInTheDocument()
  })
})
