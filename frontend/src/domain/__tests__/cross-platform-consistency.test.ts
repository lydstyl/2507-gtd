import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskSortingPriorityService } from '../services/TaskSortingPriorityService'
import { TaskEntity } from '../entities/Task'

// Mock timer for consistent date testing
const mockDate = new Date('2025-01-15T10:00:00Z') // Wednesday
vi.useFakeTimers()
vi.setSystemTime(mockDate)

describe('Frontend Domain Consistency', () => {
  let dateContext: ReturnType<typeof TaskSortingPriorityService.createDateContext>

  beforeEach(() => {
    dateContext = TaskSortingPriorityService.createDateContext()
  })

  describe('Date Context Creation', () => {
    it('should create consistent date contexts', () => {
      const context1 = TaskSortingPriorityService.createDateContext()
      const context2 = TaskSortingPriorityService.createDateContext()

      expect(context1.today.getTime()).toBe(context2.today.getTime())
      expect(context1.tomorrow.getTime()).toBe(context2.tomorrow.getTime())
      expect(context1.dayAfterTomorrow.getTime()).toBe(context2.dayAfterTomorrow.getTime())
    })

    it('should normalize dates correctly', () => {
      const testDate = '2025-01-15T15:30:45.123Z'
      const normalized = TaskSortingPriorityService.normalizeDate(testDate)

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
      const collectedTask = new TaskEntity({
        id: 'collected-1',
        name: 'Collected Task',
        importance: 50,
        complexity: 1,
        points: 500,
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
      })

      expect(collectedTask.getCategory()).toBe('collected')
      expect(TaskSortingPriorityService.isCollectedTask(collectedTask.rawTask, dateContext)).toBe(true)
    })

    it('should correctly categorize overdue tasks', () => {
      const overdueTask = new TaskEntity({
        id: 'overdue-1',
        name: 'Overdue Task',
        importance: 25,
        complexity: 5,
        points: 50,
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
      })

      expect(overdueTask.getCategory()).toBe('overdue')
      expect(TaskSortingPriorityService.isOverdueTask(overdueTask.rawTask, dateContext)).toBe(true)
    })

    it('should correctly categorize today tasks', () => {
      const todayTask = new TaskEntity({
        id: 'today-1',
        name: 'Today Task',
        importance: 25,
        complexity: 5,
        points: 50,
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
      })

      expect(todayTask.getCategory()).toBe('today')
      expect(TaskSortingPriorityService.isTodayTask(todayTask.rawTask, dateContext)).toBe(true)
    })

    it('should correctly categorize tomorrow tasks', () => {
      const tomorrowTask = new TaskEntity({
        id: 'tomorrow-1',
        name: 'Tomorrow Task',
        importance: 25,
        complexity: 5,
        points: 50,
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
      })

      expect(tomorrowTask.getCategory()).toBe('tomorrow')
      expect(TaskSortingPriorityService.isTomorrowTask(tomorrowTask.rawTask, dateContext)).toBe(true)
    })

    it('should correctly categorize future tasks', () => {
      const futureTask = new TaskEntity({
        id: 'future-1',
        name: 'Future Task',
        importance: 25,
        complexity: 5,
        points: 50,
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
      })

      expect(futureTask.getCategory()).toBe('future')
      expect(TaskSortingPriorityService.isFutureTask(futureTask.rawTask, dateContext)).toBe(true)
    })

    it('should correctly categorize no-date tasks', () => {
      const noDateTask = new TaskEntity({
        id: 'no-date-1',
        name: 'No Date Task',
        importance: 25,
        complexity: 5,
        points: 50,
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
      })

      expect(noDateTask.getCategory()).toBe('no-date')
      expect(TaskSortingPriorityService.isCollectedTask(noDateTask.rawTask, dateContext)).toBe(false)
    })

    it('should prioritize urgent due dates over planned dates', () => {
      const taskWithBothDates = new TaskEntity({
        id: 'urgent-due-1',
        name: 'Urgent Due Task',
        importance: 25,
        complexity: 5,
        points: 50,
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
      })

      expect(taskWithBothDates.getCategory()).toBe('today')
      expect(TaskSortingPriorityService.isTodayTask(taskWithBothDates.rawTask, dateContext)).toBe(true)
    })
  })

  describe('Task Comparison Logic', () => {
    const taskA = new TaskEntity({
      id: 'task-a',
      name: 'Task A',
      importance: 30,
      complexity: 3,
      points: 100,
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
    })

    const taskB = new TaskEntity({
      id: 'task-b',
      name: 'Task B',
      importance: 20,
      complexity: 5,
      points: 40,
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
    })

    it('should compare tasks by category priority', () => {
      const comparison = TaskSortingPriorityService.compareByCategory(taskA.rawTask, taskB.rawTask, dateContext)
      // Task A is 'today' (priority 3), Task B is 'tomorrow' (priority 4)
      // Lower priority number comes first
      expect(comparison).toBeLessThan(0) // today < tomorrow
    })

    it('should compare tasks by points', () => {
      const comparison = TaskSortingPriorityService.compareByPoints(taskA.rawTask, taskB.rawTask)
      // Task A has 100 points, Task B has 40 points
      // Higher points come first
      expect(comparison).toBeLessThan(0) // 100 > 40
    })

    it('should perform complete task priority comparison', () => {
      const comparison = TaskSortingPriorityService.compareTasksPriority(taskA.rawTask, taskB.rawTask, dateContext)
      // Task A (today) should come before Task B (tomorrow)
      expect(comparison).toBeLessThan(0)
    })
  })

  describe('Category Priority Ordering', () => {
    it('should maintain correct category priority ordering', () => {
      const categories = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future'] as const

      categories.forEach((category, index) => {
        const priority = TaskSortingPriorityService.getCategoryPriority(category)
        expect(priority).toBe(index + 1)
      })
    })

    it('should have collected as highest priority', () => {
      expect(TaskSortingPriorityService.getCategoryPriority('collected')).toBe(1)
    })

    it('should have future as lowest priority', () => {
      expect(TaskSortingPriorityService.getCategoryPriority('future')).toBe(6)
    })
  })

  describe('Date Urgency Detection', () => {
    it('should detect urgent dates correctly', () => {
      // Today should be urgent
      expect(TaskSortingPriorityService.isDateUrgent('2025-01-15T10:00:00.000Z', dateContext)).toBe(true)
      // Tomorrow should be urgent
      expect(TaskSortingPriorityService.isDateUrgent('2025-01-16T10:00:00.000Z', dateContext)).toBe(true)
      // Yesterday should be urgent (within 2 days window)
      expect(TaskSortingPriorityService.isDateUrgent('2025-01-14T10:00:00.000Z', dateContext)).toBe(true)
      // Day after tomorrow should not be urgent
      expect(TaskSortingPriorityService.isDateUrgent('2025-01-17T10:00:00.000Z', dateContext)).toBe(false)
      // Far future should not be urgent
      expect(TaskSortingPriorityService.isDateUrgent('2025-01-20T10:00:00.000Z', dateContext)).toBe(false)
    })
  })

  describe('Effective Date Calculation', () => {
    it('should use planned date when no urgent due date', () => {
      const task = {
        id: 'test',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
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

      const effectiveDate = TaskSortingPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate?.getTime()).toBe(new Date('2025-01-16T00:00:00.000Z').getTime())
    })

    it('should prioritize urgent due dates over planned dates', () => {
      const task = {
        id: 'test',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
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

      const effectiveDate = TaskSortingPriorityService.getEffectiveDate(task, dateContext)
      // Should use due date since it's urgent
      expect(effectiveDate?.getTime()).toBe(new Date('2025-01-15T00:00:00.000Z').getTime())
    })

    it('should return null when no effective date', () => {
      const task = {
        id: 'test',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
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

      const effectiveDate = TaskSortingPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate).toBeNull()
    })
  })
})