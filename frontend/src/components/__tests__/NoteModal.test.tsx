import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteModal } from '../NoteModal'
import type { Task } from '../../types/task'

// Mock de l'éditeur TipTap (lourd à monter en jsdom) : on expose le contenu
// reçu pour vérifier que le lazy-load synchronise bien l'éditeur, et un
// input pour simuler des modifications (onChange) dans les tests.
vi.mock('../NoteEditor', () => ({
  NoteEditor: ({
    content,
    onChange
  }: {
    content: string
    onChange: (value: string) => void
  }) => (
    <div data-testid="note-editor">
      <span>{content}</span>
      <input
        data-testid="note-editor-input"
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
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

describe('NoteModal — bouton Terminer', () => {
  it('visible quand onMarkCompleted fourni et tâche non terminée', () => {
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={noop}
        onMarkCompleted={noop}
      />
    )
    expect(screen.getByText('Terminer')).toBeInTheDocument()
  })

  it('absent si onMarkCompleted non fourni ou tâche déjà terminée', () => {
    const { rerender } = render(
      <NoteModal task={{ ...baseTask, note: '<p>x</p>' }} isOpen onClose={noop} onSave={noop} />
    )
    expect(screen.queryByText('Terminer')).not.toBeInTheDocument()

    rerender(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>', isCompleted: true }}
        isOpen
        onClose={noop}
        onSave={noop}
        onMarkCompleted={noop}
      />
    )
    expect(screen.queryByText('Terminer')).not.toBeInTheDocument()
  })

  it('clic : complète la tâche PUIS ferme la modale', async () => {
    const calls: string[] = []
    const onMarkCompleted = vi.fn(async () => {
      calls.push('complete')
    })
    const onClose = vi.fn(() => calls.push('close'))
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={onClose}
        onSave={noop}
        onMarkCompleted={onMarkCompleted}
      />
    )
    await userEvent.click(screen.getByText('Terminer'))
    expect(onMarkCompleted).toHaveBeenCalledWith('task-1')
    expect(calls).toEqual(['complete', 'close'])
  })

  it('échec de complétion : la modale ne se ferme pas', async () => {
    const onClose = vi.fn()
    const onMarkCompleted = vi.fn(async () => {
      throw new Error('boom')
    })
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={onClose}
        onSave={noop}
        onMarkCompleted={onMarkCompleted}
      />
    )
    await userEvent.click(screen.getByText('Terminer'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('NoteModal — sélecteur de statut (sauvegarde immédiate)', () => {
  it('changement de statut : PUT immédiat avec le nouveau statut', async () => {
    const user = userEvent.setup()
    const onSaveStatus = vi.fn(async () => {})
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={noop}
        onSaveStatus={onSaveStatus}
      />
    )
    await user.selectOptions(screen.getByLabelText('Statut'), 'pret')
    expect(onSaveStatus).toHaveBeenCalledWith('task-1', 'pret')
  })

  it('re-sélection du statut d\'origine (prop stale) : le PUT part bien (régr. garde stale)', async () => {
    const user = userEvent.setup()
    // Le prop `task` n'est PAS re-fetché après le 1er PUT (comportement réel :
    // noteTaskDetail reste stale). Avant le fix, la 2e sélection était ignorée
    // car `next === task.status` → divergence UI/DB.
    const onSaveStatus = vi.fn(async () => {})
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }} // status: 'brouillon' (stale ensuite)
        isOpen
        onClose={noop}
        onSave={noop}
        onSaveStatus={onSaveStatus}
      />
    )
    await user.selectOptions(screen.getByLabelText('Statut'), 'pret')
    expect(onSaveStatus).toHaveBeenCalledTimes(1)
    // Re-sélection de 'brouillon' alors que task.status est encore 'brouillon'
    await user.selectOptions(screen.getByLabelText('Statut'), 'brouillon')
    expect(onSaveStatus).toHaveBeenCalledTimes(2)
    expect(onSaveStatus).toHaveBeenLastCalledWith('task-1', 'brouillon')
  })

  it('échec du PUT : rollback du select sur le dernier statut persisté', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const onSaveStatus = vi.fn(async () => {
      throw new Error('boom')
    })
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={noop}
        onSaveStatus={onSaveStatus}
      />
    )
    await user.selectOptions(screen.getByLabelText('Statut'), 'pret')
    expect(onSaveStatus).toHaveBeenCalled()
    expect(
      (screen.getByLabelText('Statut') as HTMLSelectElement).value
    ).toBe('brouillon')
    alertSpy.mockRestore()
  })
})

describe('NoteModal — bouton « Éditer la tâche » (sauvegarde avant bascule)', () => {
  it('note/titre non modifiés : ouvre l’édition sans aucun PUT', async () => {
    const onSave = vi.fn(async () => {})
    const onSaveName = vi.fn(async () => {})
    const onOpenEdit = vi.fn()
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={onSave}
        onSaveName={onSaveName}
        onOpenEdit={onOpenEdit}
      />
    )
    await userEvent.click(screen.getByText('Éditer la tâche'))
    expect(onSave).not.toHaveBeenCalled()
    expect(onSaveName).not.toHaveBeenCalled()
    expect(onOpenEdit).toHaveBeenCalledTimes(1)
  })

  it('note modifiée : sauvegarde la note AVANT d’ouvrir l’édition', async () => {
    const calls: string[] = []
    const onSave = vi.fn(async () => {
      calls.push('save')
    })
    const onOpenEdit = vi.fn(() => calls.push('open'))
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={onSave}
        onOpenEdit={onOpenEdit}
      />
    )
    await userEvent.clear(screen.getByTestId('note-editor-input'))
    await userEvent.type(
      screen.getByTestId('note-editor-input'),
      '<p>modifié</p>'
    )
    await userEvent.click(screen.getByText('Éditer la tâche'))
    expect(onSave).toHaveBeenCalledWith('task-1', '<p>modifié</p>')
    expect(calls).toEqual(['save', 'open'])
  })

  it('titre modifié : sauvegarde le titre (trimmé) AVANT d’ouvrir l’édition', async () => {
    const calls: string[] = []
    const onSave = vi.fn(async () => {})
    const onSaveName = vi.fn(async () => {
      calls.push('saveName')
    })
    const onOpenEdit = vi.fn(() => calls.push('open'))
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={onSave}
        onSaveName={onSaveName}
        onOpenEdit={onOpenEdit}
      />
    )
    await userEvent.type(
      screen.getByLabelText('Titre de la tâche (modifiable)'),
      ' (complément)'
    )
    await userEvent.click(screen.getByText('Éditer la tâche'))
    expect(onSave).not.toHaveBeenCalled()
    expect(onSaveName).toHaveBeenCalledWith(
      'task-1',
      'Tâche avec note (complément)'
    )
    expect(calls).toEqual(['saveName', 'open'])
  })

  it('échec de la sauvegarde : ne bascule PAS sur l’édition', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const onSave = vi.fn(async () => {
      throw new Error('boom')
    })
    const onOpenEdit = vi.fn()
    render(
      <NoteModal
        task={{ ...baseTask, note: '<p>x</p>' }}
        isOpen
        onClose={noop}
        onSave={onSave}
        onOpenEdit={onOpenEdit}
      />
    )
    await userEvent.clear(screen.getByTestId('note-editor-input'))
    await userEvent.type(screen.getByTestId('note-editor-input'), 'y')
    await userEvent.click(screen.getByText('Éditer la tâche'))
    expect(onOpenEdit).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })
})
