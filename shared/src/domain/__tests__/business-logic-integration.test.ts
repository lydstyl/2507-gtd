import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskPriorityService } from '../services/TaskPriorityService'
import { GenericTaskWithSubtasks } from '../entities/TaskTypes'

// Mock timer for consistent date testing
const mockDate = new Date('2025-01-15T10:00:00Z') // Wednesday
vi.useFakeTimers()
vi.setSystemTime(mockDate)

describe('Shared Domain Business Logic Integration', () => {
  let dateContext: ReturnType<typeof TaskPriorityService.createDateContext>

  beforeEach(() => {
    dateContext = TaskPriorityService.createDateContext()
  })

  describe('Date Context Creation', () => {
    it('should create consistent date contexts', () => {
      const context1 = TaskPriorityService.createDateContext()
      const context2 = TaskPriorityService.createDateContext()

      expect(context1.today.getTime()).toBe(context2.today.getTime())
      expect(context1.tomorrow.getTime()).toBe(context2.tomorrow.getTime())
      expect(context1.dayAfterTomorrow.getTime()).toBe(context2.dayAfterTomorrow.getTime())
    })

    it('should normalize dates correctly', () => {
      const testDate = '2025-01-15T15:30:45.123Z'
      const normalized = TaskPriorityService.normalizeDate(testDate)

      // Should be normalized to UTC midnight of the same date
      expect(normalized.getUTCHours()).toBe(0)
      expect(normalized.getUTCMinutes()).toBe(0)
      expect(normalized.getUTCSeconds()).toBe(0)
      expect(normalized.getUTCMilliseconds()).toBe(0)
      expect(normalized.getUTCFullYear()).toBe(2025)
      expect(normalized.getUTCMonth()).toBe(0) // January is 0
      expect(normalized.getUTCDate()).toBe(15)
    })
  })

  describe('Task Categorization Business Rules', () => {
    it('should correctly categorize collected tasks', () => {
      const collectedTask: GenericTaskWithSubtasks<string> = {
        id: 'collected-1',
        name: 'Collected Task',
        importance: 0, // Must be 0 for collected
        complexity: 3, // Must be 3 for collected
        points: 0,
        position: 0,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(collectedTask, dateContext)).toBe('collected')
      expect(TaskPriorityService.isCollectedTask(collectedTask, dateContext)).toBe(true)
    })

    it('should correctly categorize overdue tasks', () => {
      const overdueTask: GenericTaskWithSubtasks<string> = {
        id: 'overdue-1',
        name: 'Overdue Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-14T10:00:00.000Z', // Yesterday
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-10T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(overdueTask, dateContext)).toBe('overdue')
      expect(TaskPriorityService.isOverdueTask(overdueTask, dateContext)).toBe(true)
    })

    it('should correctly categorize today tasks', () => {
      const todayTask: GenericTaskWithSubtasks<string> = {
        id: 'today-1',
        name: 'Today Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-15T15:00:00.000Z', // Today
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(todayTask, dateContext)).toBe('today')
      expect(TaskPriorityService.isTodayTask(todayTask, dateContext)).toBe(true)
    })

    it('should correctly categorize tomorrow tasks', () => {
      const tomorrowTask: GenericTaskWithSubtasks<string> = {
        id: 'tomorrow-1',
        name: 'Tomorrow Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-16T10:00:00.000Z', // Tomorrow
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(tomorrowTask, dateContext)).toBe('tomorrow')
      expect(TaskPriorityService.isTomorrowTask(tomorrowTask, dateContext)).toBe(true)
    })

    it('should correctly categorize future tasks', () => {
      const futureTask: GenericTaskWithSubtasks<string> = {
        id: 'future-1',
        name: 'Future Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-18T10:00:00.000Z', // Future
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(futureTask, dateContext)).toBe('future')
      expect(TaskPriorityService.isFutureTask(futureTask, dateContext)).toBe(true)
    })

    it('should correctly categorize no-date tasks', () => {
      const noDateTask: GenericTaskWithSubtasks<string> = {
        id: 'no-date-1',
        name: 'No Date Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(noDateTask, dateContext)).toBe('no-date')
      expect(TaskPriorityService.isCollectedTask(noDateTask, dateContext)).toBe(false)
    })

    it('should prioritize urgent due dates over planned dates', () => {
      const taskWithBothDates: GenericTaskWithSubtasks<string> = {
        id: 'urgent-due-1',
        name: 'Urgent Due Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-20T10:00:00.000Z', // Future planned date
        dueDate: '2025-01-15T15:00:00.000Z', // Today urgent due date
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.getTaskCategory(taskWithBothDates, dateContext)).toBe('today')
      expect(TaskPriorityService.isTodayTask(taskWithBothDates, dateContext)).toBe(true)
    })
  })

  describe('Task Comparison Logic', () => {
    const taskA: GenericTaskWithSubtasks<string> = {
      id: 'task-a',
      name: 'Task A',
      importance: 30,
      complexity: 3,
      points: 100,
        position: 0,
      plannedDate: '2025-01-15T15:00:00.000Z', // Today
      dueDate: undefined,
      parentId: undefined,
      userId: 'user1',
      isCompleted: false,
      completedAt: undefined,
      createdAt: '2025-01-14T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
      subtasks: [],
      tags: []
    }

    const taskB: GenericTaskWithSubtasks<string> = {
      id: 'task-b',
      name: 'Task B',
      importance: 20,
      complexity: 5,
      points: 40,
        position: 0,
      plannedDate: '2025-01-16T10:00:00.000Z', // Tomorrow
      dueDate: undefined,
      parentId: undefined,
      userId: 'user1',
      isCompleted: false,
      completedAt: undefined,
      createdAt: '2025-01-14T11:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
      subtasks: [],
      tags: []
    }

    it('should compare tasks by category priority', () => {
      const comparison = TaskPriorityService.compareByCategory(taskA, taskB, dateContext)
      // Task A is 'today' (priority 3), Task B is 'tomorrow' (priority 4)
      // Lower priority number comes first
      expect(comparison).toBeLessThan(0) // today < tomorrow
    })

    it('should compare tasks by points', () => {
      const comparison = TaskPriorityService.compareByPoints(taskA, taskB)
      // Task A has 100 points, Task B has 40 points
      // Higher points come first
      expect(comparison).toBeLessThan(0) // 100 > 40
    })

    it('should perform complete task priority comparison', () => {
      const comparison = TaskPriorityService.compareTasksPriority(taskA, taskB, dateContext)
      // Task A (today) should come before Task B (tomorrow)
      expect(comparison).toBeLessThan(0)
    })
  })

  describe('Category Priority Ordering', () => {
    it('should maintain correct category priority ordering', () => {
      const categories = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future'] as const

      categories.forEach((category, index) => {
        const priority = TaskPriorityService.getCategoryPriority(category)
        expect(priority).toBe(index + 1)
      })
    })

    it('should have collected as highest priority', () => {
      expect(TaskPriorityService.getCategoryPriority('collected')).toBe(1)
    })

    it('should have future as lowest priority', () => {
      expect(TaskPriorityService.getCategoryPriority('future')).toBe(6)
    })
  })

  describe('Date Urgency Detection', () => {
    it('should detect urgent dates correctly', () => {
      // Today should be urgent
      expect(TaskPriorityService.isDateUrgent('2025-01-15T10:00:00.000Z', dateContext)).toBe(true)
      // Tomorrow should be urgent
      expect(TaskPriorityService.isDateUrgent('2025-01-16T10:00:00.000Z', dateContext)).toBe(true)
      // Yesterday should be urgent (within 2 days window)
      expect(TaskPriorityService.isDateUrgent('2025-01-14T10:00:00.000Z', dateContext)).toBe(true)
      // Day after tomorrow should not be urgent
      expect(TaskPriorityService.isDateUrgent('2025-01-17T10:00:00.000Z', dateContext)).toBe(false)
      // Far future should not be urgent
      expect(TaskPriorityService.isDateUrgent('2025-01-20T10:00:00.000Z', dateContext)).toBe(false)
    })
  })

  describe('Effective Date Calculation', () => {
    it('should use planned date when no urgent due date', () => {
      const task: GenericTaskWithSubtasks<string> = {
        id: 'test',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-16T10:00:00.000Z', // Tomorrow
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      const effectiveDate = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate?.getTime()).toBe(new Date('2025-01-16T00:00:00.000Z').getTime())
    })

    it('should prioritize urgent due dates over planned dates', () => {
      const task: GenericTaskWithSubtasks<string> = {
        id: 'test',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: '2025-01-20T10:00:00.000Z', // Future planned date
        dueDate: '2025-01-15T15:00:00.000Z', // Today urgent due date
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      const effectiveDate = TaskPriorityService.getEffectiveDate(task, dateContext)
      // Should use due date since it's urgent
      expect(effectiveDate?.getTime()).toBe(new Date('2025-01-15T00:00:00.000Z').getTime())
    })

    it('should return null when no effective date', () => {
      const task: GenericTaskWithSubtasks<string> = {
        id: 'test',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        position: 0,
        plannedDate: undefined,
        dueDate: '2025-01-20T10:00:00.000Z', // Non-urgent due date
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      const effectiveDate = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate).toBeNull()
    })
  })

  describe('Complex Business Scenarios', () => {
    it('should handle collected tasks correctly', () => {
      // Collected tasks: importance=0, complexity=3, no effective date
      const collectedTask: GenericTaskWithSubtasks<string> = {
        id: 'collected',
        name: 'New Task',
        importance: 0,
        complexity: 3,
        points: 0,
        position: 0,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.isCollectedTask(collectedTask, dateContext)).toBe(true)
      expect(TaskPriorityService.getTaskCategory(collectedTask, dateContext)).toBe('collected')
    })

    it('should handle urgent due dates that override planned dates', () => {
      const urgentDueTask: GenericTaskWithSubtasks<string> = {
        id: 'urgent-due',
        name: 'Urgent Due Task',
        importance: 30,
        complexity: 2,
        points: 150,
        position: 0,
        plannedDate: '2025-01-25T10:00:00.000Z', // Far future
        dueDate: '2025-01-16T10:00:00.000Z', // Tomorrow (urgent)
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.isDateUrgent(urgentDueTask.dueDate!, dateContext)).toBe(true)
      expect(TaskPriorityService.getTaskCategory(urgentDueTask, dateContext)).toBe('tomorrow')
      expect(TaskPriorityService.isTomorrowTask(urgentDueTask, dateContext)).toBe(true)
    })

    it('should handle tasks with both dates where due date is not urgent', () => {
      const nonUrgentDueTask: GenericTaskWithSubtasks<string> = {
        id: 'non-urgent-due',
        name: 'Non-Urgent Due Task',
        importance: 25,
        complexity: 4,
        points: 62,
        position: 0,
        plannedDate: '2025-01-17T10:00:00.000Z', // Day after tomorrow
        dueDate: '2025-01-20T10:00:00.000Z', // Non-urgent due date
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      }

      expect(TaskPriorityService.isDateUrgent(nonUrgentDueTask.dueDate!, dateContext)).toBe(false)
      expect(TaskPriorityService.getTaskCategory(nonUrgentDueTask, dateContext)).toBe('future')
      expect(TaskPriorityService.isFutureTask(nonUrgentDueTask, dateContext)).toBe(true)
    })
  })

  describe('Sorting Algorithm Validation', () => {
    const createTestTask = (
      id: string,
      name: string,
      importance: number,
      complexity: number,
      plannedDate?: string,
      dueDate?: string
    ): GenericTaskWithSubtasks<string> => ({
      id,
      name,
      importance,
      complexity,
      points: TaskPriorityService.calculatePoints(importance, complexity),
      position: 0,
      plannedDate,
      dueDate,
      parentId: undefined,
      userId: 'user1',
      isCompleted: false,
      completedAt: undefined,
      createdAt: '2025-01-14T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
      subtasks: [],
      tags: []
    })

    it('should sort collected tasks first', () => {
      const collectedTask = createTestTask('collected', 'Collected', 0, 3)
      const overdueTask = createTestTask('overdue', 'Overdue', 25, 5, '2025-01-14T10:00:00.000Z')
      const todayTask = createTestTask('today', 'Today', 25, 5, '2025-01-15T10:00:00.000Z')

      const tasks = [todayTask, collectedTask, overdueTask]
      const sorted = [...tasks].sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))

      expect(sorted[0].id).toBe('collected')
      expect(sorted[1].id).toBe('overdue')
      expect(sorted[2].id).toBe('today')
    })

    it('should sort by points within same category', () => {
      const highPointsToday = createTestTask('high-today', 'High Points Today', 40, 2, '2025-01-15T10:00:00.000Z')
      const lowPointsToday = createTestTask('low-today', 'Low Points Today', 20, 5, '2025-01-15T10:00:00.000Z')

      const tasks = [lowPointsToday, highPointsToday]
      const sorted = [...tasks].sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))

      expect(sorted[0].id).toBe('high-today') // 200 points > 40 points
      expect(sorted[1].id).toBe('low-today')
    })

    it('should sort overdue tasks by date then points', () => {
      const veryOverdue = createTestTask('very-overdue', 'Very Overdue', 30, 3, '2025-01-13T10:00:00.000Z')
      const lessOverdue = createTestTask('less-overdue', 'Less Overdue', 40, 2, '2025-01-14T10:00:00.000Z')

      const tasks = [lessOverdue, veryOverdue]
      const sorted = [...tasks].sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))

      expect(sorted[0].id).toBe('very-overdue') // More overdue comes first
      expect(sorted[1].id).toBe('less-overdue')
    })
  })
})