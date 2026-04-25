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
        importance: 10,
        points: 100
      }),
      createTask({
        name: 'Task due today',
        dueDate: today,
        importance: 5,
        points: 50
      }),
      createTask({
        name: 'Task due tomorrow',
        dueDate: tomorrow,
        importance: 8,
        points: 75
      }),
      createTask({
        name: 'Task planned for tomorrow',
        plannedDate: tomorrow,
        importance: 20,
        points: 200
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Task due today should come first (urgent due date)
    expect(sorted[0].name).toBe('Task due today')

    // Tasks due/planned for tomorrow should be grouped together
    expect(sorted[1].name).toBe('Task planned for tomorrow') // Higher importance
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
        importance: 10,
        points: 100
      }),
      createTask({
        name: 'Task due in 3 days (non-urgent)',
        dueDate: threeDaysFromNow,
        importance: 20,  // Higher importance, due date is not urgent
        points: 200
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Non-urgent due date should not take priority, both should be in no-date category
    // Higher importance should win
    expect(sorted[0].name).toBe('Task due in 3 days (non-urgent)')
    expect(sorted[1].name).toBe('Regular task without dates')
  })

  it('should sort collected tasks (status=collecte) before date-based tasks', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasks: TaskWithSubtasks[] = [
      createTask({
        name: 'Task planned for tomorrow',
        plannedDate: tomorrow,
        importance: 25,
        points: 250
      }),
      createTask({
        name: 'Collected task',
        status: 'collecte' as any,
        importance: 0,
        complexity: 3,
        points: 0
      })
    ]

    const sorted = TaskSorting.sortTasksByPriority(tasks)

    // Collected task (explicit status) should come before date-based tasks
    expect(sorted[0].name).toBe('Collected task')
    expect(sorted[1].name).toBe('Task planned for tomorrow')
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