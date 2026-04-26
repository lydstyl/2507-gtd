import { TaskPriorityService, DateContext, BackendTaskWithSubtasks } from '@gtd/shared'
import { vi } from 'vitest'

describe('TaskPriorityService', () => {
  let dateContext: DateContext
  let today: Date
  let tomorrow: Date
  let dayAfterTomorrow: Date
  let yesterday: Date

  beforeEach(() => {
    // Set a fixed date for consistent testing
    const fixedDate = new Date('2023-06-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)

    dateContext = TaskPriorityService.createDateContext()
    today = dateContext.today
    tomorrow = dateContext.tomorrow
    dayAfterTomorrow = dateContext.dayAfterTomorrow
    yesterday = new Date(Date.UTC(2023, 5, 14)) // June 14, 2023
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createDateContext', () => {
    it('should create proper UTC date context', () => {
      expect(dateContext.today).toEqual(new Date(Date.UTC(2023, 5, 15)))
      expect(dateContext.tomorrow).toEqual(new Date(Date.UTC(2023, 5, 16)))
      expect(dateContext.dayAfterTomorrow).toEqual(new Date(Date.UTC(2023, 5, 17)))
    })
  })

  describe('normalizeDate', () => {
    it('should normalize string date to UTC midnight', () => {
      const result = TaskPriorityService.normalizeDate('2023-06-15T15:30:00Z')
      expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
    })

    it('should normalize Date object to UTC midnight', () => {
      const input = new Date('2023-06-15T15:30:00Z')
      const result = TaskPriorityService.normalizeDate(input)
      expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
    })
  })

  describe('isDateUrgent', () => {
    it('should return true for dates within 2 days', () => {
      expect(TaskPriorityService.isDateUrgent(today.toISOString(), dateContext)).toBe(true)
      expect(TaskPriorityService.isDateUrgent(tomorrow.toISOString(), dateContext)).toBe(true)
      expect(TaskPriorityService.isDateUrgent(yesterday.toISOString(), dateContext)).toBe(true)
    })

    it('should return false for dates 2+ days away', () => {
      expect(TaskPriorityService.isDateUrgent(dayAfterTomorrow.toISOString(), dateContext)).toBe(false)
    })
  })

  describe('getEffectiveDate', () => {
    it('should return due date if urgent', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        plannedDate: dayAfterTomorrow,
        dueDate: today
      })

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toEqual(today)
    })

    it('should return planned date if due date is not urgent', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        plannedDate: today,
        dueDate: dayAfterTomorrow
      })

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toEqual(today)
    })

    it('should return null if no dates', () => {
      const task: BackendTaskWithSubtasks = createTestTask({})

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toBeNull()
    })
  })

  describe('isCollectedTask', () => {
    it('should identify tasks with status collecte as collected', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'collecte' as any
      })

      expect(TaskPriorityService.isCollectedTask(task, dateContext)).toBe(true)
    })

    it('should not identify brouillon tasks as collected', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        importance: 9,
        complexity: 1,
        points: 500
      })

      expect(TaskPriorityService.isCollectedTask(task, dateContext)).toBe(false)
    })

    it('should not identify tasks with no status as collected', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        importance: 0,
        complexity: 3,
        points: 0,
        plannedDate: today.toISOString()
      })

      expect(TaskPriorityService.isCollectedTask(task, dateContext)).toBe(false)
    })
  })

  describe('getTaskCategory', () => {
    it('should categorize collected tasks', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'collecte' as any
      })

      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('collected')
    })

    it('should categorize overdue tasks', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: yesterday.toISOString()
      })

      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('pret-overdue')
    })

    it('should categorize today tasks', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: today.toISOString()
      })

      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('pret-today')
    })

    it('should categorize tomorrow tasks', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: tomorrow.toISOString()
      })

      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('pret-tomorrow')
    })

    it('should categorize future tasks', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: dayAfterTomorrow.toISOString()
      })

      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('pret-future')
    })

    it('should categorize no-date tasks', () => {
      const task: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        importance: 5,
        complexity: 5,
        points: 10
      })

      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('pret-no-date')
    })
  })

  describe('compareTasksPriority', () => {
    it('should sort collected tasks before others', () => {
      const collectedTask: BackendTaskWithSubtasks = createTestTask({
        status: 'collecte' as any,
        importance: 0,
        complexity: 3,
        points: 0
      })
      const normalTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        importance: 5,
        complexity: 5,
        points: 10
      })

      const result = TaskPriorityService.compareTasksPriority(collectedTask, normalTask, dateContext)
      expect(result).toBeLessThan(0) // collected task comes first
    })

    it('should sort pret-overdue tasks before pret-today tasks', () => {
      const overdueTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: yesterday.toISOString(),
        points: 10
      })
      const todayTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: today.toISOString(),
        points: 10
      })

      const result = TaskPriorityService.compareTasksPriority(overdueTask, todayTask, dateContext)
      expect(result).toBeLessThan(0) // overdue task comes first
    })

    it('should sort by importance within same category', () => {
      const highImportanceTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: today.toISOString(),
        importance: 30,
        points: 100
      })
      const lowImportanceTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: today.toISOString(),
        importance: 5,
        points: 10
      })

      const result = TaskPriorityService.compareTasksPriority(highImportanceTask, lowImportanceTask, dateContext)
      expect(result).toBeLessThan(0) // high importance task comes first
    })

    it('should sort pret-overdue tasks by date (oldest first)', () => {
      const veryOverdueTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: new Date(Date.UTC(2023, 5, 13)).toISOString(), // June 13
        points: 10
      })
      const recentlyOverdueTask: BackendTaskWithSubtasks = createTestTask({
        status: 'pret' as any,
        plannedDate: yesterday.toISOString(), // June 14
        points: 10
      })

      const result = TaskPriorityService.compareTasksPriority(veryOverdueTask, recentlyOverdueTask, dateContext)
      expect(result).toBeLessThan(0) // very overdue task comes first
    })
  })

  describe('getCategoryPriority', () => {
    it('should return correct priority order', () => {
      expect(TaskPriorityService.getCategoryPriority('brouillon')).toBe(1)
      expect(TaskPriorityService.getCategoryPriority('pour-ia')).toBe(2)
      expect(TaskPriorityService.getCategoryPriority('collected')).toBe(3)
      expect(TaskPriorityService.getCategoryPriority('pret-overdue')).toBe(4)
      expect(TaskPriorityService.getCategoryPriority('pret-today')).toBe(5)
      expect(TaskPriorityService.getCategoryPriority('pret-tomorrow')).toBe(6)
      expect(TaskPriorityService.getCategoryPriority('pret-no-date')).toBe(7)
      expect(TaskPriorityService.getCategoryPriority('pret-future')).toBe(8)
      expect(TaskPriorityService.getCategoryPriority('un-jour')).toBe(9)
    })
  })
})

function createTestTask(overrides: Partial<BackendTaskWithSubtasks> = {}): BackendTaskWithSubtasks {
  return {
    id: '1',
    name: 'Test Task',
    importance: 5,
    complexity: 5,
    points: 10,
    plannedDate: undefined,
    dueDate: undefined,
    parentId: undefined,
    userId: 'user1',
    isCompleted: false,
    completedAt: undefined,
    createdAt: new Date('2023-06-15T10:00:00Z'),
    updatedAt: new Date('2023-06-15T10:00:00Z'),
    subtasks: [],
    tags: [],
    ...overrides
  }
}