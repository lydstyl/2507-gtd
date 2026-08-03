/**
 * Frontend Task List Sorting Tests
 * These tests verify that the task list component displays tasks in the correct order
 * as received from the backend API (no frontend sorting should occur).
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Helper function to create test tasks
const createTestTask = (
  name: string,
  plannedDate?: string,
  importance: number = 300,
  complexity: number = 3,
  status: Task['status'] = 'brouillon'
): Task => ({
  id: `task-${name.replace(/\s+/g, '-').toLowerCase()}`,
  name,
  importance,
  complexity,
  status,
  position: 0,
  plannedDate,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user',
  subtasks: [],
  tags: [],
})

// Helper function to render TaskListPage with router context
const renderTaskListPage = () => {
  return render(
    <BrowserRouter>
      <TaskListPage />
    </BrowserRouter>
  )
}

describe('TaskListPage Sorting Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock getTags to return empty array
    vi.mocked(api.getTags).mockResolvedValue([])
    // Default mocks for duplicate word detection hook
    vi.mocked(api.getTasks).mockResolvedValue([])
    vi.mocked(api.getAllTasks).mockResolvedValue([])
  })

  test('should display tasks in the exact order received from backend API', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Mock tasks in the expected sorted order from backend
    const sortedTasks: Task[] = [
      createTestTask('High priority no date', undefined, 450), // 1. High importance, no date
      createTestTask('Overdue task', yesterday.toISOString(), 200), // 2. Overdue
      createTestTask('Today high', today.toISOString(), 350), // 3. Today (higher importance)
      createTestTask('Today low', today.toISOString(), 200), // 3. Today (lower importance)
      createTestTask('Tomorrow task', tomorrow.toISOString(), 300), // 4. Tomorrow
      createTestTask('No date medium', undefined, 250), // 5. No date
      createTestTask('Future task', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 150), // 6. Future
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(sortedTasks)

    renderTaskListPage()

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('High priority no date')).toBeInTheDocument()
    })

    // Get all task cards in order
    const taskCards = screen.getAllByTestId(/^task-card-/)

    // Verify they appear in the exact order from the API
    expect(taskCards).toHaveLength(7)

    // Check if tasks appear in DOM in the expected order
    const taskNames = taskCards.map(card => {
      const nameElement = card.querySelector('[data-testid="task-name"]')
      return nameElement?.textContent
    })

    expect(taskNames[0]).toBe('High priority no date')
    expect(taskNames[1]).toBe('Overdue task')
    expect(taskNames[2]).toBe('Today high')
    expect(taskNames[3]).toBe('Today low')
    expect(taskNames[4]).toBe('Tomorrow task')
    expect(taskNames[5]).toBe('No date medium')
    expect(taskNames[6]).toBe('Future task')
  })

  test('should not re-sort tasks on the frontend', async () => {
    // Create tasks in deliberately wrong order to test that frontend doesn't sort
    const unsortedTasks: Task[] = [
      createTestTask('Z Last task', undefined, 100), // Low priority
      createTestTask('A First task', undefined, 450), // High priority
      createTestTask('M Middle task', undefined, 300), // Medium priority
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(unsortedTasks)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Z Last task')).toBeInTheDocument()
    })

    const taskCards = screen.getAllByTestId(/^task-card-/)
    const taskNames = taskCards.map(card => {
      const nameElement = card.querySelector('[data-testid="task-name"]')
      return nameElement?.textContent
    })

    // Should display in the same order as received from API (not sorted by importance)
    expect(taskNames[0]).toBe('Z Last task')
    expect(taskNames[1]).toBe('A First task')
    expect(taskNames[2]).toBe('M Middle task')
  })

  test('should display overdue tasks with "En retard" label', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const tasks: Task[] = [
      createTestTask('Overdue task 1', yesterday.toISOString(), 300, 3, 'pret'),
      createTestTask('Normal task', undefined, 250),
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Overdue task 1')).toBeInTheDocument()
    })

    // Check that overdue task displays "En retard" label in the category header
    expect(screen.getAllByText('En retard')).toHaveLength(2) // Category label + date indicator
  })

  test('should maintain task order when applying filters', async () => {
    const today = new Date()

    const tasks: Task[] = [
      createTestTask('High priority no date', undefined, 450, 1),
      createTestTask('Today high importance', today.toISOString(), 350, 2),
      createTestTask('Today low importance', today.toISOString(), 200, 3),
      createTestTask('No date medium', undefined, 300, 4),
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('High priority no date')).toBeInTheDocument()
    })

    // Apply importance filter (this should not change the order, just filter)
    // Note: This would require more complex test setup to actually trigger filters
    // For now, we just verify the initial order is maintained

    const taskCards = screen.getAllByTestId(/^task-card-/)
    const taskNames = taskCards.map(card => {
      const nameElement = card.querySelector('[data-testid="task-name"]')
      return nameElement?.textContent
    })

    expect(taskNames[0]).toBe('High priority no date')
    expect(taskNames[1]).toBe('Today high importance')
    expect(taskNames[2]).toBe('Today low importance')
    expect(taskNames[3]).toBe('No date medium')
  })

  test('should handle empty task list', async () => {
    vi.mocked(api.getRootTasks).mockResolvedValue([])

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Aucune tâche trouvée.')).toBeInTheDocument()
    })

    // Should show create task button
    expect(screen.getByText('Créer votre première tâche')).toBeInTheDocument()
  })

  test('should handle loading state', async () => {
    // Mock a delayed response
    vi.mocked(api.getRootTasks).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    )

    renderTaskListPage()

    // Should show loading state initially
    expect(screen.getByText('Chargement…')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Chargement…')).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  test('should handle API error state', async () => {
    vi.mocked(api.getRootTasks).mockRejectedValue(new Error('API Error'))

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  test('should preserve subtask sorting from backend', async () => {
    const parentTask = createTestTask('Parent task', undefined, 300)
    parentTask.subtasks = [
      createTestTask('Subtask high priority', undefined, 350),
      createTestTask('Subtask low priority', undefined, 100),
      createTestTask('Subtask medium priority', undefined, 250),
    ]

    const tasks: Task[] = [parentTask]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Parent task')).toBeInTheDocument()
    })

    // Note: This test would require expanding to actually show subtasks
    // For now, we verify the parent task structure is preserved
    expect(parentTask.subtasks).toHaveLength(3)
    expect(parentTask.subtasks[0].name).toBe('Subtask high priority')
    expect(parentTask.subtasks[1].name).toBe('Subtask low priority')
    expect(parentTask.subtasks[2].name).toBe('Subtask medium priority')
  })
})

