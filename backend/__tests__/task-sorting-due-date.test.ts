import { describe, it, expect } from 'vitest'
import { TaskSorting } from '../src/infrastructure/repositories/TaskSorting'
import { TaskWithSubtasks } from '../src/domain/entities/Task'

describe('TaskSorting - Due Date Priority', () => {
  const createTask = (overrides: Partial<TaskWithSubtasks> = {}): TaskWithSubtasks => ({
    id: Math.random().toString(),
    name: 'Test Task',
    importance: 25,
    complexity: 1,
    points: 250,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    subtasks: [],
    tags: [],
    ...overrides
  })

  it('should prioritize tasks with urgent due dates over planned dates', () => {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)

    const tasks: TaskWithSubtasks[] = [
      createTask({
        name: 'Task with future planned date',
        plannedDate: futureDate,
        points: 100
      }),
      createTask({
        name: 'Task due today',
        dueDate: today,
        points: 50
      }),
      createTask({
        name: 'Task due tomorrow',
        dueDate: tomorrow,
        points: 75
      }),
      createTask({
        name: 'Task planned for tomorrow',
        plannedDate: tomorrow,
        points: 200
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Task due today should come first (urgent due date)
    expect(sorted[0].name).toBe('Task due today')

    // Tasks due/planned for tomorrow should be grouped together
    expect(sorted[1].name).toBe('Task planned for tomorrow') // Higher points
    expect(sorted[2].name).toBe('Task due tomorrow')

    // Future planned date comes last
    expect(sorted[3].name).toBe('Task with future planned date')
  })

  it('should treat overdue due dates as urgent', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)

    const tasks: TaskWithSubtasks[] = [
      createTask({
        name: 'Task planned for future',
        plannedDate: futureDate,
        points: 300
      }),
      createTask({
        name: 'Task overdue by due date',
        dueDate: yesterday,
        points: 100
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Overdue due date should come first despite lower points
    expect(sorted[0].name).toBe('Task overdue by due date')
    expect(sorted[1].name).toBe('Task planned for future')
  })

  it('should not treat due dates beyond 2 days as urgent', () => {
    const today = new Date()
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    const tasks: TaskWithSubtasks[] = [
      createTask({
        name: 'Regular task without dates',
        points: 100
      }),
      createTask({
        name: 'Task due in 3 days (non-urgent)',
        dueDate: threeDaysFromNow,
        points: 200  // Higher points but due date is not urgent
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Non-urgent due date should not take priority, both should be in no-date category
    // Higher points should win
    expect(sorted[0].name).toBe('Task due in 3 days (non-urgent)')
    expect(sorted[1].name).toBe('Regular task without dates')
  })

  it('should not consider collected tasks if they have urgent due dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasks: TaskWithSubtasks[] = [
      createTask({
        name: 'High priority task with urgent due date',
        importance: 0,
        complexity: 3,
        points: 500,
        dueDate: tomorrow
      }),
      createTask({
        name: 'Regular collected task',
        importance: 0,
        complexity: 3,
        points: 0
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // The task with urgent due date should be in tomorrow category, not collected
    expect(sorted[0].name).toBe('Regular collected task')
    expect(sorted[1].name).toBe('High priority task with urgent due date')
  })

  it('should handle tasks with both planned and due dates correctly', () => {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)

    const tasks: TaskWithSubtasks[] = [
      createTask({
        name: 'Task due today but planned for future',
        plannedDate: futureDate,
        dueDate: today,
        points: 100
      }),
      createTask({
        name: 'Task planned for today but due in future',
        plannedDate: today,
        dueDate: futureDate,
        points: 100
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Both should be in today category, but due date takes priority in sorting
    expect(sorted[0].name).toBe('Task due today but planned for future')
    expect(sorted[1].name).toBe('Task planned for today but due in future')
  })
})