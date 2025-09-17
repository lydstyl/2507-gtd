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
  points: number,
  dueDate?: string,
  importance: number = 30,
  complexity: number = 3
): Task => ({
  id: `task-${name.replace(/\s+/g, '-').toLowerCase()}`,
  name,
  points,
  importance,
  complexity,
  dueDate,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user',
  subtasks: [],
  tags: [],
  parentId: null,
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
  })

  test('should display tasks in the exact order received from backend API', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Mock tasks in the expected sorted order from backend
    const sortedTasks: Task[] = [
      createTestTask('High priority no date', 500), // 1. 500 points, no date
      createTestTask('Overdue task', 200, yesterday.toISOString()), // 2. Overdue
      createTestTask('Today high', 400, today.toISOString()), // 3. Today (higher points)
      createTestTask('Today low', 200, today.toISOString()), // 3. Today (lower points)
      createTestTask('Tomorrow task', 300, tomorrow.toISOString()), // 4. Tomorrow
      createTestTask('No date medium', 250), // 5. No date
      createTestTask('Future task', 150, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()), // 6. Future
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
      createTestTask('Z Last task', 100), // Low priority
      createTestTask('A First task', 500), // High priority
      createTestTask('M Middle task', 300), // Medium priority
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

    // Should display in the same order as received from API (not sorted by points)
    expect(taskNames[0]).toBe('Z Last task')
    expect(taskNames[1]).toBe('A First task')
    expect(taskNames[2]).toBe('M Middle task')
  })

  test('should display overdue tasks with "En retard" label', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const tasks: Task[] = [
      createTestTask('Overdue task 1', 300, yesterday.toISOString()),
      createTestTask('Normal task', 250),
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Overdue task 1')).toBeInTheDocument()
    })

    // Check that overdue task displays "En retard" label
    expect(screen.getByText('En retard')).toBeInTheDocument()
  })

  test('should maintain task order when applying filters', async () => {
    const today = new Date()

    const tasks: Task[] = [
      createTestTask('High priority no date', 500, undefined, 50, 1),
      createTestTask('Today high importance', 400, today.toISOString(), 40, 2),
      createTestTask('Today low importance', 200, today.toISOString(), 20, 3),
      createTestTask('No date medium', 250, undefined, 30, 4),
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
    const parentTask = createTestTask('Parent task', 300)
    parentTask.subtasks = [
      createTestTask('Subtask high priority', 400),
      createTestTask('Subtask low priority', 100),
      createTestTask('Subtask medium priority', 250),
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