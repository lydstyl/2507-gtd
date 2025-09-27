import { Task, TaskWithSubtasks, User, Tag, CreateTaskData, UpdateTaskData } from '../../src/domain/entities/Task'
import { DateContext } from '@gtd/shared'

/**
 * Test utilities and helpers for domain and use case testing
 */

/**
 * Create a mock task with default values and optional overrides
 */
export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-task-1',
    name: 'Test Task',
    link: undefined,
    note: undefined,
    importance: 25,
    complexity: 5,
    points: 50, // 10 * 25 / 5 = 50
    parentId: undefined,
    plannedDate: undefined,
    dueDate: undefined,
    isCompleted: false,
    completedAt: undefined,
    createdAt: new Date('2023-06-15T10:00:00Z'),
    updatedAt: new Date('2023-06-15T10:00:00Z'),
    userId: 'test-user-1',
    user: undefined,
    ...overrides
  }
}

/**
 * Create a mock task with subtasks
 */
export function createMockTaskWithSubtasks(overrides: Partial<TaskWithSubtasks> = {}): TaskWithSubtasks {
  const baseTask = createMockTask(overrides)
  return {
    ...baseTask,
    subtasks: [],
    tags: [],
    ...overrides
  }
}

/**
 * Create a mock user with default values and optional overrides
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    password: 'hashedpassword123',
    createdAt: new Date('2023-06-01T00:00:00Z'),
    updatedAt: new Date('2023-06-01T00:00:00Z'),
    ...overrides
  }
}

/**
 * Create a mock tag with default values and optional overrides
 */
export function createMockTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'test-tag-1',
    name: 'Test Tag',
    color: '#3B82F6',
    position: 0,
    userId: 'test-user-1',
    createdAt: new Date('2023-06-01T00:00:00Z'),
    updatedAt: new Date('2023-06-01T00:00:00Z'),
    user: undefined,
    ...overrides
  }
}

/**
 * Create a mock date context for testing with fixed dates
 */
export function createMockDateContext(baseDate: Date = new Date('2023-06-15T12:00:00Z')): DateContext {
  return {
    today: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())),
    tomorrow: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1)),
    dayAfterTomorrow: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 2))
  }
}

/**
 * Create a mock CreateTaskData object
 */
export function createMockCreateTaskData(overrides: Partial<CreateTaskData> = {}): CreateTaskData {
  return {
    name: 'New Test Task',
    link: undefined,
    note: undefined,
    importance: 25,
    complexity: 5,
    parentId: undefined,
    tagIds: [],
    userId: 'test-user-1',
    plannedDate: undefined,
    dueDate: undefined,
    isCompleted: false,
    ...overrides
  }
}

/**
 * Create a mock UpdateTaskData object
 */
export function createMockUpdateTaskData(overrides: Partial<UpdateTaskData> = {}): UpdateTaskData {
  return {
    name: 'Updated Test Task',
    importance: 30,
    complexity: 3,
    ...overrides
  }
}

/**
 * Assert that a task has the expected category
 */
export function assertTaskCategory(
  task: TaskWithSubtasks,
  expectedCategory: 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future',
  dateContext: DateContext
): void {
  const { TaskPriorityService } = require('../../src/domain/services/TaskPriorityService')
  const actualCategory = TaskPriorityService.getTaskCategory(task, dateContext)

  if (actualCategory !== expectedCategory) {
    throw new Error(
      `Expected task to be categorized as '${expectedCategory}' but got '${actualCategory}'. ` +
      `Task: ${JSON.stringify({
        name: task.name,
        importance: task.importance,
        complexity: task.complexity,
        points: task.points,
        plannedDate: task.plannedDate,
        dueDate: task.dueDate
      }, null, 2)}`
    )
  }
}

/**
 * Create test tasks for different categories
 */
export function createTestTasksByCategory(dateContext: DateContext) {
  const yesterday = new Date(dateContext.today.getTime() - 24 * 60 * 60 * 1000)

  return {
    collected: createMockTaskWithSubtasks({
      name: 'Collected Task',
      importance: 0,
      complexity: 3,
      points: 0
    }),

    collectedHighPriority: createMockTaskWithSubtasks({
      name: 'High Priority Collected Task',
      importance: 50,
      complexity: 1,
      points: 500
    }),

    overdue: createMockTaskWithSubtasks({
      name: 'Overdue Task',
      importance: 30,
      complexity: 5,
      points: 60,
      plannedDate: yesterday
    }),

    today: createMockTaskWithSubtasks({
      name: 'Today Task',
      importance: 40,
      complexity: 4,
      points: 100,
      plannedDate: dateContext.today
    }),

    tomorrow: createMockTaskWithSubtasks({
      name: 'Tomorrow Task',
      importance: 20,
      complexity: 2,
      points: 100,
      plannedDate: dateContext.tomorrow
    }),

    future: createMockTaskWithSubtasks({
      name: 'Future Task',
      importance: 15,
      complexity: 3,
      points: 50,
      plannedDate: dateContext.dayAfterTomorrow
    }),

    noDate: createMockTaskWithSubtasks({
      name: 'No Date Task',
      importance: 25,
      complexity: 5,
      points: 50
    })
  }
}

/**
 * Validate that a task points calculation is correct
 */
export function validateTaskPoints(task: { importance: number; complexity: number; points: number }): boolean {
  const expectedPoints = Math.round(10 * task.importance / task.complexity)
  const clampedPoints = Math.max(0, Math.min(500, expectedPoints))
  return task.points === clampedPoints
}

/**
 * Create a range of test dates relative to a base date
 */
export function createTestDates(baseDate: Date = new Date('2023-06-15T12:00:00Z')) {
  return {
    baseDate,
    yesterday: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
    today: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())),
    tomorrow: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1)),
    dayAfterTomorrow: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 2)),
    nextWeek: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7)),
    nextMonth: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate()))
  }
}

/**
 * Mock repository base class for testing use cases
 */
export class MockRepository<T> {
  private items: T[] = []
  private nextId = 1

  async create(data: Partial<T>): Promise<T> {
    const item = {
      id: `mock-id-${this.nextId++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as T

    this.items.push(item)
    return item
  }

  async findById(id: string): Promise<T | null> {
    return this.items.find((item: any) => item.id === id) || null
  }

  async findAll(): Promise<T[]> {
    return [...this.items]
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const index = this.items.findIndex((item: any) => item.id === id)
    if (index === -1) return null

    this.items[index] = {
      ...this.items[index],
      ...data,
      updatedAt: new Date()
    } as T

    return this.items[index]
  }

  async delete(id: string): Promise<boolean> {
    const index = this.items.findIndex((item: any) => item.id === id)
    if (index === -1) return false

    this.items.splice(index, 1)
    return true
  }

  async exists(id: string): Promise<boolean> {
    return this.items.some((item: any) => item.id === id)
  }

  // Test utility methods
  reset(): void {
    this.items = []
    this.nextId = 1
  }

  getItems(): T[] {
    return [...this.items]
  }

  setItems(items: T[]): void {
    this.items = [...items]
  }
}

/**
 * Error testing utilities
 */
export class TestError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'TestError'
  }
}

export function expectToThrow(fn: () => any, expectedMessage?: string): void {
  let didThrow = false
  try {
    fn()
  } catch (error) {
    didThrow = true
    if (expectedMessage && error instanceof Error) {
      if (!error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}" but got "${error.message}"`)
      }
    }
  }

  if (!didThrow) {
    throw new Error('Expected function to throw an error but it did not')
  }
}

export async function expectToThrowAsync(fn: () => Promise<any>, expectedMessage?: string): Promise<void> {
  let didThrow = false
  try {
    await fn()
  } catch (error) {
    didThrow = true
    if (expectedMessage && error instanceof Error) {
      if (!error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}" but got "${error.message}"`)
      }
    }
  }

  if (!didThrow) {
    throw new Error('Expected async function to throw an error but it did not')
  }
}