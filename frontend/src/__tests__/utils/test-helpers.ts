import { Task, TaskEntity, CreateTaskData, UpdateTaskData } from '../../domain/entities/Task'
import { Tag } from '../../domain/entities/Tag'
import { User } from '../../domain/entities/User'

/**
 * Frontend test utilities and helpers for domain and use case testing
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
    plannedDate: undefined,
    dueDate: undefined,
    parentId: undefined,
    userId: 'test-user-1',
    isCompleted: false,
    completedAt: undefined,
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2023-06-15T10:00:00Z',
    subtasks: [],
    tags: [],
    ...overrides
  }
}

/**
 * Create a mock TaskEntity instance
 */
export function createMockTaskEntity(overrides: Partial<Task> = {}): TaskEntity {
  const task = createMockTask(overrides)
  return new TaskEntity(task)
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
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
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
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
    ...overrides
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
    plannedDate: undefined,
    dueDate: undefined,
    parentId: undefined,
    tagIds: [],
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
 * Create test dates relative to a base date
 */
export function createTestDates(baseDate: Date = new Date('2023-06-15T12:00:00Z')) {
  return {
    baseDate,
    yesterday: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    today: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())).toISOString(),
    tomorrow: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1)).toISOString(),
    dayAfterTomorrow: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 2)).toISOString(),
    nextWeek: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 7)).toISOString(),
    nextMonth: new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate())).toISOString()
  }
}

/**
 * Create test tasks for different categories
 */
export function createTestTasksByCategory(dates = createTestDates()) {
  return {
    collected: createMockTaskEntity({
      name: 'Collected Task',
      importance: 0,
      complexity: 3,
      points: 0
    }),

    collectedHighPriority: createMockTaskEntity({
      name: 'High Priority Collected Task',
      importance: 50,
      complexity: 1,
      points: 500
    }),

    overdue: createMockTaskEntity({
      name: 'Overdue Task',
      importance: 30,
      complexity: 5,
      points: 60,
      plannedDate: dates.yesterday
    }),

    today: createMockTaskEntity({
      name: 'Today Task',
      importance: 40,
      complexity: 4,
      points: 100,
      plannedDate: dates.today
    }),

    tomorrow: createMockTaskEntity({
      name: 'Tomorrow Task',
      importance: 20,
      complexity: 2,
      points: 100,
      plannedDate: dates.tomorrow
    }),

    future: createMockTaskEntity({
      name: 'Future Task',
      importance: 15,
      complexity: 3,
      points: 50,
      plannedDate: dates.dayAfterTomorrow
    }),

    noDate: createMockTaskEntity({
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
 * Mock repository class for testing use cases
 */
export class MockRepository<T> {
  private items: T[] = []
  private nextId = 1

  async create(data: Partial<T>): Promise<T> {
    const item = {
      id: `mock-id-${this.nextId++}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString()
    } as T

    return this.items[index]
  }

  async delete(id: string): Promise<boolean> {
    const index = this.items.findIndex((item: any) => item.id === id)
    if (index === -1) return false

    this.items.splice(index, 1)
    return true
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

/**
 * Assert that a task has the expected category
 */
export function assertTaskCategory(
  task: TaskEntity,
  expectedCategory: 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future'
): void {
  const actualCategory = task.getCategory()

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
 * Setup test environment with fake timers
 */
export function setupTestEnvironment(fixedDate: Date = new Date('2023-06-15T12:00:00Z')) {
  // This would be used with vitest's vi.setSystemTime()
  return {
    fixedDate,
    today: new Date(Date.UTC(fixedDate.getFullYear(), fixedDate.getMonth(), fixedDate.getDate())),
    tomorrow: new Date(Date.UTC(fixedDate.getFullYear(), fixedDate.getMonth(), fixedDate.getDate() + 1)),
    yesterday: new Date(Date.UTC(fixedDate.getFullYear(), fixedDate.getMonth(), fixedDate.getDate() - 1))
  }
}

/**
 * Validate that two tasks are sorted correctly according to priority rules
 */
export function validateTaskOrder(higherPriorityTask: TaskEntity, lowerPriorityTask: TaskEntity): boolean {
  const higherCategory = higherPriorityTask.getCategory()
  const lowerCategory = lowerPriorityTask.getCategory()

  const categoryPriorities = {
    collected: 1,
    overdue: 2,
    today: 3,
    tomorrow: 4,
    'no-date': 5,
    future: 6
  }

  const higherPriority = categoryPriorities[higherCategory]
  const lowerPriority = categoryPriorities[lowerCategory]

  if (higherPriority !== lowerPriority) {
    return higherPriority < lowerPriority
  }

  // Same category, check points
  return higherPriorityTask.points >= lowerPriorityTask.points
}

/**
 * Create test scenario for edge cases
 */
export function createEdgeCaseScenarios() {
  return {
    emptyTask: createMockTaskEntity({
      name: '',
      importance: 0,
      complexity: 1,
      points: 0
    }),

    maxPointsTask: createMockTaskEntity({
      name: 'Max Points Task',
      importance: 50,
      complexity: 1,
      points: 500
    }),

    complexTask: createMockTaskEntity({
      name: 'Complex Task',
      importance: 10,
      complexity: 9,
      points: 11 // 10 * 10 / 9 = 11.11... -> 11
    }),

    taskWithSubtasks: createMockTaskEntity({
      name: 'Parent Task',
      subtasks: [
        createMockTask({
          id: 'subtask-1',
          name: 'Subtask 1',
          parentId: 'parent-task'
        }),
        createMockTask({
          id: 'subtask-2',
          name: 'Subtask 2',
          parentId: 'parent-task'
        })
      ]
    }),

    taskWithTags: createMockTaskEntity({
      name: 'Tagged Task',
      tags: [
        createMockTag({ id: 'tag-1', name: 'Work' }),
        createMockTag({ id: 'tag-2', name: 'Urgent' })
      ]
    })
  }
}