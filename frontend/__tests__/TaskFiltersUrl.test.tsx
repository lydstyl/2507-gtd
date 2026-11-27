/**
 * Filtres /tasks dans l'URL (partageables)
 * Une URL avec query params applique les filtres sur n'importe quelle machine,
 * et tout changement de filtre est miroité dans l'URL.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import TaskListPage from '../src/components/TaskListPage'
import { Task } from '../src/types/task'

// Mock the API module
vi.mock('../src/utils/api', () => ({
  api: {
    getRootTasks: vi.fn(),
    getTags: vi.fn(),
    getTasks: vi.fn(),
    getAllTasks: vi.fn(),
    updateTask: vi.fn(),
    markTaskCompleted: vi.fn(),
    deleteTask: vi.fn(),
    updateTaskNote: vi.fn(),
    deleteTaskNote: vi.fn(),
  }
}))

const { api } = await import('../src/utils/api')

const makeTask = (name: string): Task => ({
  id: `task-${name.replace(/\s+/g, '-').toLowerCase()}`,
  name,
  importance: 300,
  complexity: 3,
  status: 'brouillon',
  plannedDate: undefined,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user',
  subtasks: [],
  tags: [],
  parentId: null,
})

const renderPage = () =>
  render(
    <BrowserRouter>
      <TaskListPage />
    </BrowserRouter>
  )

describe("Filtres /tasks dans l'URL (partageables)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.stubGlobal('alert', vi.fn())
    vi.mocked(api.getTasks).mockResolvedValue([])
    vi.mocked(api.getAllTasks).mockResolvedValue([])
    window.history.replaceState(null, '', '/')
  })

  test("les filtres de l'URL s'appliquent au chargement (URL partagée)", async () => {
    vi.mocked(api.getRootTasks).mockResolvedValue([
      makeTask('Test Task'),
      makeTask('Autre Tache'),
    ])
    vi.mocked(api.getTags).mockResolvedValue([])
    // URL partagée : recherche "Test"
    window.history.replaceState(null, '', '/tasks?q=Test')
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
    expect(screen.queryByText('Autre Tache')).not.toBeInTheDocument()
  })

  test("changer un filtre met à jour l'URL", async () => {
    vi.mocked(api.getRootTasks).mockResolvedValue([makeTask('Test Task')])
    vi.mocked(api.getTags).mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()
    const input = await screen.findByPlaceholderText('Rechercher une tâche...')
    await user.type(input, 'Test')
    await waitFor(() => {
      expect(window.location.search).toContain('q=Test')
    })
  })
})
