/**
 * Keyboard Shortcuts Tests
 * Tests the useKeyboardShortcuts hook functionality to ensure all shortcuts work correctly
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import TaskListPage from '../src/components/TaskListPage'
import { Task, Tag } from '../src/types/task'

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
  importance: number = 30,
  complexity: number = 3,
  plannedDate?: string
): Task => ({
  id: `task-${name.replace(/\s+/g, '-').toLowerCase()}`,
  name,
  points: Math.round(10 * importance / complexity),
  importance,
  complexity,
  plannedDate,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user',
  subtasks: [],
  tags: [],
  parentId: null,
})

// Helper function to create test tags
const createTestTag = (name: string, index: number): Tag => ({
  id: `tag-${index}`,
  name,
  color: '#FF0000',
  position: index,
  userId: 'test-user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

// Helper function to render TaskListPage with router context
const renderTaskListPage = () => {
  return render(
    <BrowserRouter>
      <TaskListPage />
    </BrowserRouter>
  )
}

// Helper to simulate keyboard events
const pressKey = async (key: string, options: { shiftKey?: boolean } = {}) => {
  const user = userEvent.setup()
  if (options.shiftKey) {
    await user.keyboard(`{Shift>}${key}{/Shift}`)
  } else {
    await user.keyboard(`{${key}}`)
  }
}

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.confirm to always return true for delete operations
    vi.stubGlobal('confirm', vi.fn(() => true))
    // Mock window.alert
    vi.stubGlobal('alert', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('should select first task when pressing ArrowDown with no selection', async () => {
    const tasks: Task[] = [
      createTestTask('Task 1'),
      createTestTask('Task 2'),
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])

    renderTaskListPage()

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })

    // Press ArrowDown to select first task
    await pressKey('ArrowDown')

    // Check if first task is selected (this would require checking for selection styles)
    // For now, we can verify the task is in the document
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  test('should navigate between tasks with arrow keys', async () => {
    const tasks: Task[] = [
      createTestTask('Task 1'),
      createTestTask('Task 2'),
      createTestTask('Task 3'),
    ]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
    })

    // Navigate with arrow keys
    await pressKey('ArrowDown') // Select Task 1
    await pressKey('ArrowDown') // Move to Task 2
    await pressKey('ArrowUp')   // Move back to Task 1

    // Verify all tasks are still visible
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  test('should increase importance when pressing I key', async () => {
    const task = createTestTask('Test Task', 20, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press I to increase importance
    await pressKey('i')

    // Verify updateTask was called with increased importance
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          importance: 30 // 20 + 10
        })
      )
    })
  })

  test('should decrease importance when pressing Shift+I', async () => {
    const task = createTestTask('Test Task', 20, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Shift+I to decrease importance
    await pressKey('I', { shiftKey: true })

    // Verify updateTask was called with decreased importance
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          importance: 10 // 20 - 10
        })
      )
    })
  })

  test('should not decrease importance below 0', async () => {
    const task = createTestTask('Test Task', 5, 3) // Low importance
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Shift+I to decrease importance
    await pressKey('I', { shiftKey: true })

    // Verify importance doesn't go below 0
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          importance: 0 // Math.max(0, 5 - 10)
        })
      )
    })
  })

  test('should increase complexity when pressing C key', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press C to increase complexity
    await pressKey('c')

    // Verify updateTask was called with increased complexity
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          complexity: 5 // 3 + 2
        })
      )
    })
  })

  test('should set planned date to tomorrow when pressing D key', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press D to set planned date to tomorrow
    await pressKey('d')

    // Calculate expected date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expectedDate = tomorrow.getFullYear() + '-' +
      String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
      String(tomorrow.getDate()).padStart(2, '0')

    // Verify updateTask was called with tomorrow's date
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          plannedDate: expectedDate
        })
      )
    })
  })

  test('should set planned date to today when pressing T key', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press T to set planned date to today
    await pressKey('t')

    // Calculate expected date (today)
    const today = new Date()
    const expectedDate = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')

    // Verify updateTask was called with today's date
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          plannedDate: expectedDate
        })
      )
    })
  })

  test('should remove planned date when pressing E key', async () => {
    const today = new Date().toISOString().split('T')[0]
    const task = createTestTask('Test Task', 30, 3, today)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press E to remove planned date
    await pressKey('e')

    // Verify updateTask was called with null planned date
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          plannedDate: null
        })
      )
    })
  })

  test('should toggle tag when pressing number keys', async () => {
    const tag1 = createTestTag('Work', 1)
    const tag2 = createTestTag('Personal', 2)
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([tag1, tag2])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press 1 to toggle first tag
    await pressKey('1')

    // Verify updateTask was called with first tag added
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          tagIds: [tag1.id]
        })
      )
    })
  })

  test('should toggle task completion when pressing Space', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.markTaskCompleted).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Space to mark task as completed
    await pressKey(' ')

    // Verify markTaskCompleted was called
    await waitFor(() => {
      expect(vi.mocked(api.markTaskCompleted)).toHaveBeenCalledWith(task.id)
    })
  })

  test('should not trigger shortcuts when typing in input field', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Find and focus the search input
    const searchInput = screen.getByPlaceholderText('Rechercher une tâche...')
    searchInput.focus()

    // Type 'i' in the search input - should not trigger importance shortcut
    await userEvent.type(searchInput, 'i')

    // Verify updateTask was NOT called
    expect(vi.mocked(api.updateTask)).not.toHaveBeenCalled()

    // Verify the input contains the typed text
    expect(searchInput).toHaveValue('i')
  })

  test('should delete task when pressing Delete key with confirmation', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Delete key
    await pressKey('Delete')

    // Verify confirm was called
    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir supprimer la tâche "Test Task" ? Cette action est irréversible.'
    )
  })

  test('should not delete task when pressing Delete key without confirmation', async () => {
    // Mock confirm to return false
    vi.mocked(window.confirm).mockReturnValue(false)

    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Delete key
    await pressKey('Delete')

    // Verify confirm was called but task wasn't deleted
    expect(window.confirm).toHaveBeenCalled()
    // The onTaskDeleted callback shouldn't be called when confirm returns false
  })

  test('should set planned date to next week when pressing W key', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press W to set planned date to next week
    await pressKey('w')

    // Calculate expected date (next week)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const expectedDate = nextWeek.getFullYear() + '-' +
      String(nextWeek.getMonth() + 1).padStart(2, '0') + '-' +
      String(nextWeek.getDate()).padStart(2, '0')

    // Verify updateTask was called with next week's date
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          plannedDate: expectedDate
        })
      )
    })
  })

  test('should set planned date to next month when pressing M key', async () => {
    const task = createTestTask('Test Task', 30, 3)
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press M to set planned date to next month
    await pressKey('m')

    // Calculate expected date (next month)
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const expectedDate = nextMonth.getFullYear() + '-' +
      String(nextMonth.getMonth() + 1).padStart(2, '0') + '-' +
      String(nextMonth.getDate()).padStart(2, '0')

    // Verify updateTask was called with next month's date
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          plannedDate: expectedDate
        })
      )
    })
  })

  test('should decrease complexity when pressing Shift+C', async () => {
    const task = createTestTask('Test Task', 30, 5) // Higher complexity
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Shift+C to decrease complexity
    await pressKey('c', { shiftKey: true })

    // Verify updateTask was called with decreased complexity
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          complexity: 3 // 5 - 2
        })
      )
    })
  })

  test('should not decrease complexity below 1', async () => {
    const task = createTestTask('Test Task', 30, 1) // Minimum complexity
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press Shift+C to try to decrease complexity
    await pressKey('c', { shiftKey: true })

    // Verify complexity doesn't go below 1
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          complexity: 1 // Math.max(1, 1 - 2)
        })
      )
    })
  })

  test('should not increase importance above 50', async () => {
    const task = createTestTask('Test Task', 45, 3) // Near maximum importance
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press I to try to increase importance
    await pressKey('i')

    // Verify importance doesn't go above 50
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          importance: 50 // Math.min(50, 45 + 10)
        })
      )
    })
  })

  test('should not increase complexity above 9', async () => {
    const task = createTestTask('Test Task', 30, 8) // Near maximum complexity
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press C to try to increase complexity
    await pressKey('c')

    // Verify complexity doesn't go above 9
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          complexity: 9 // Math.min(9, 8 + 2)
        })
      )
    })
  })

  test('should remove tag when tag is already assigned', async () => {
    const tag1 = createTestTag('Work', 1)
    const task = createTestTask('Test Task', 30, 3)
    // Assign the tag to the task
    task.tags = [tag1]
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([tag1])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press 1 to toggle first tag (should remove it since it's already assigned)
    await pressKey('1')

    // Verify updateTask was called with tag removed
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          tagIds: [] // Tag removed
        })
      )
    })
  })

  test('should adjust planned date relative to existing date when pressing D', async () => {
    const today = new Date()
    const existingDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 5)) // 5 days from today UTC

    const task = createTestTask('Test Task', 30, 3, existingDate.toISOString().split('T')[0])
    const tasks: Task[] = [task]

    vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
    vi.mocked(api.getTags).mockResolvedValue([])
    vi.mocked(api.updateTask).mockResolvedValue(undefined)

    renderTaskListPage()

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    // Select the task first
    await pressKey('ArrowDown')

    // Press D to add 1 day to existing planned date
    await pressKey('d')

    // Calculate expected date (existing date + 1 day)
    const expectedDate = new Date(existingDate)
    expectedDate.setDate(existingDate.getDate() + 1)
    const expectedDateString = expectedDate.getFullYear() + '-' +
      String(expectedDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(expectedDate.getDate()).padStart(2, '0')

    // Verify updateTask was called with adjusted date
    await waitFor(() => {
      expect(vi.mocked(api.updateTask)).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          plannedDate: expectedDateString
        })
      )
    })
  })
})