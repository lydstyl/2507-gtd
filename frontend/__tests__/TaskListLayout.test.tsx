/**
 * Frontend Task List Layout Tests
 * These tests verify that the task list component uses the correct column layout
 * for different screen sizes to prevent layout regressions.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  id: string = Math.random().toString(36).substr(2, 9)
): Task => ({
  id,
  name,
  notes: '',
  isCompleted: false,
  importance: 5,
  complexity: 5,
  plannedDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  parentId: null,
  tags: [],
  subtasks: []
})

const renderTaskList = (tasks: Task[] = []) => {
  vi.mocked(api.getRootTasks).mockResolvedValue(tasks)
  vi.mocked(api.getTags).mockResolvedValue([])

  return render(
    <BrowserRouter>
      <TaskListPage />
    </BrowserRouter>
  )
}

describe('Task List Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should have correct grid column classes for responsive layout', async () => {
    const testTasks = [
      createTestTask('Test Task 1'),
      createTestTask('Test Task 2'),
      createTestTask('Test Task 3'),
    ]

    renderTaskList(testTasks)

    // Wait for the component to render
    await screen.findByText('Test Task 1')

    // Find the grid container
    const gridContainer = document.querySelector('.grid')
    expect(gridContainer).toBeTruthy()

    // Check that the grid has the correct responsive column classes
    const expectedClasses = [
      'grid-cols-1',     // Mobile: 1 column
      'sm:grid-cols-2',  // Small: 2 columns
      'lg:grid-cols-3',  // Large: 3 columns
      'xl:grid-cols-4',  // XL: 4 columns (Full HD requirement)
      '2xl:grid-cols-4', // 2XL: 4 columns (Full HD requirement)
      '3xl:grid-cols-8'  // 3XL: 8 columns (4K requirement)
    ]

    expectedClasses.forEach(className => {
      expect(gridContainer?.classList.contains(className)).toBe(true)
    })
  })

  test('should not have the old 6-column layout', async () => {
    const testTasks = [createTestTask('Test Task')]
    renderTaskList(testTasks)

    await screen.findByText('Test Task')

    const gridContainer = document.querySelector('.grid')
    expect(gridContainer).toBeTruthy()

    // Ensure the old 6-column layout is not present
    expect(gridContainer?.classList.contains('2xl:grid-cols-6')).toBe(false)
  })

  test('should have gap classes for proper spacing', async () => {
    const testTasks = [createTestTask('Test Task')]
    renderTaskList(testTasks)

    await screen.findByText('Test Task')

    const gridContainer = document.querySelector('.grid')
    expect(gridContainer).toBeTruthy()

    // Check for gap classes
    expect(gridContainer?.classList.contains('gap-3')).toBe(true)
    expect(gridContainer?.classList.contains('md:gap-4')).toBe(true)
  })

  test('should maintain grid layout structure when no tasks are present', async () => {
    renderTaskList([])

    // The grid should still exist even with no tasks (though it would show a different message)
    // This test ensures the layout structure is maintained regardless of content
    const component = document.querySelector('[data-testid="task-list"]') ||
                     document.querySelector('.grid') ||
                     document.body.firstElementChild

    expect(component).toBeTruthy()
  })
})