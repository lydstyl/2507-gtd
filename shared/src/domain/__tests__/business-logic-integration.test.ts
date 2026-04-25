import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskPriorityService } from '../services/TaskPriorityService'
import { GenericTaskWithSubtasks, TaskStatus } from '../entities/TaskTypes'

// Mock timer for consistent date testing
const mockDate = new Date('2025-01-15T10:00:00Z') // Wednesday
vi.useFakeTimers()
vi.setSystemTime(mockDate)

const makeTask = (
  overrides: Partial<GenericTaskWithSubtasks<string>> & { status?: TaskStatus }
): GenericTaskWithSubtasks<string> => ({
  id: 'task-1',
  name: 'Task',
  importance: 25,
  complexity: 5,
  points: 50,
  position: 0,
  status: 'brouillon',
  plannedDate: undefined,
  dueDate: undefined,
  parentId: undefined,
  userId: 'user1',
  isCompleted: false,
  completedAt: undefined,
  createdAt: '2025-01-14T10:00:00.000Z',
  updatedAt: '2025-01-15T10:00:00.000Z',
  subtasks: [],
  tags: [],
  ...overrides
})

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

      expect(normalized.getUTCHours()).toBe(0)
      expect(normalized.getUTCMinutes()).toBe(0)
      expect(normalized.getUTCSeconds()).toBe(0)
      expect(normalized.getUTCMilliseconds()).toBe(0)
      expect(normalized.getUTCFullYear()).toBe(2025)
      expect(normalized.getUTCMonth()).toBe(0)
      expect(normalized.getUTCDate()).toBe(15)
    })
  })

  describe('Task Categorization Business Rules', () => {
    it('should categorize collected tasks by status', () => {
      const collectedTask = makeTask({ status: 'collecte' })
      expect(TaskPriorityService.getTaskCategory(collectedTask, dateContext)).toBe('collected')
      expect(TaskPriorityService.isCollectedTask(collectedTask, dateContext)).toBe(true)
    })

    it('should categorize pour_ia tasks by status', () => {
      const pourIaTask = makeTask({ status: 'pour_ia' })
      expect(TaskPriorityService.getTaskCategory(pourIaTask, dateContext)).toBe('pour-ia')
    })

    it('should categorize brouillon tasks with no date as brouillon', () => {
      const brouillonTask = makeTask({ status: 'brouillon' })
      expect(TaskPriorityService.getTaskCategory(brouillonTask, dateContext)).toBe('brouillon')
    })

    it('should categorize overdue tasks', () => {
      const overdueTask = makeTask({
        status: 'brouillon',
        plannedDate: '2025-01-14T10:00:00.000Z' // Yesterday
      })
      expect(TaskPriorityService.getTaskCategory(overdueTask, dateContext)).toBe('overdue')
      expect(TaskPriorityService.isOverdueTask(overdueTask, dateContext)).toBe(true)
    })

    it('should categorize today tasks', () => {
      const todayTask = makeTask({
        status: 'brouillon',
        plannedDate: '2025-01-15T15:00:00.000Z' // Today
      })
      expect(TaskPriorityService.getTaskCategory(todayTask, dateContext)).toBe('today')
      expect(TaskPriorityService.isTodayTask(todayTask, dateContext)).toBe(true)
    })

    it('should categorize tomorrow tasks', () => {
      const tomorrowTask = makeTask({
        status: 'brouillon',
        plannedDate: '2025-01-16T10:00:00.000Z' // Tomorrow
      })
      expect(TaskPriorityService.getTaskCategory(tomorrowTask, dateContext)).toBe('tomorrow')
      expect(TaskPriorityService.isTomorrowTask(tomorrowTask, dateContext)).toBe(true)
    })

    it('should categorize future tasks', () => {
      const futureTask = makeTask({
        status: 'brouillon',
        plannedDate: '2025-01-18T10:00:00.000Z' // Future
      })
      expect(TaskPriorityService.getTaskCategory(futureTask, dateContext)).toBe('future')
      expect(TaskPriorityService.isFutureTask(futureTask, dateContext)).toBe(true)
    })

    it('should categorize un_jour_peut_etre tasks by status', () => {
      const somedayTask = makeTask({ status: 'un_jour_peut_etre', plannedDate: '2025-01-14T10:00:00.000Z' })
      expect(TaskPriorityService.getTaskCategory(somedayTask, dateContext)).toBe('un-jour')
    })

    it('should prioritize urgent due dates over planned dates', () => {
      const task = makeTask({
        status: 'brouillon',
        plannedDate: '2025-01-20T10:00:00.000Z', // Future planned date
        dueDate: '2025-01-15T15:00:00.000Z' // Today urgent due date
      })
      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('today')
      expect(TaskPriorityService.isTodayTask(task, dateContext)).toBe(true)
    })
  })

  describe('Task Comparison Logic', () => {
    const taskA = makeTask({
      id: 'task-a',
      name: 'Task A',
      status: 'brouillon',
      importance: 30,
      complexity: 3,
      points: 100,
      plannedDate: '2025-01-15T15:00:00.000Z' // Today
    })

    const taskB = makeTask({
      id: 'task-b',
      name: 'Task B',
      status: 'brouillon',
      importance: 20,
      complexity: 5,
      points: 40,
      plannedDate: '2025-01-16T10:00:00.000Z' // Tomorrow
    })

    it('should compare tasks by category priority', () => {
      const comparison = TaskPriorityService.compareByCategory(taskA, taskB, dateContext)
      // Task A is 'today' (priority 5), Task B is 'tomorrow' (priority 6)
      expect(comparison).toBeLessThan(0)
    })

    it('should compare tasks by importance', () => {
      const comparison = TaskPriorityService.compareByImportance(taskA, taskB)
      // Task A importance=30 > Task B importance=20
      expect(comparison).toBeLessThan(0)
    })

    it('should perform complete task priority comparison', () => {
      const comparison = TaskPriorityService.compareTasksPriority(taskA, taskB, dateContext)
      // Task A (today) should come before Task B (tomorrow)
      expect(comparison).toBeLessThan(0)
    })
  })

  describe('Category Priority Ordering', () => {
    it('should have brouillon as highest priority', () => {
      expect(TaskPriorityService.getCategoryPriority('brouillon')).toBe(1)
    })

    it('should have pour-ia second', () => {
      expect(TaskPriorityService.getCategoryPriority('pour-ia')).toBe(2)
    })

    it('should have collected third', () => {
      expect(TaskPriorityService.getCategoryPriority('collected')).toBe(3)
    })

    it('should have future as second-to-last priority', () => {
      expect(TaskPriorityService.getCategoryPriority('future')).toBe(8)
    })

    it('should maintain correct category priority ordering', () => {
      const expected: Array<[string, number]> = [
        ['brouillon', 1],
        ['pour-ia', 2],
        ['collected', 3],
        ['overdue', 4],
        ['today', 5],
        ['tomorrow', 6],
        ['no-date', 7],
        ['future', 8],
        ['un-jour', 9]
      ]
      expected.forEach(([category, priority]) => {
        expect(TaskPriorityService.getCategoryPriority(category as any)).toBe(priority)
      })
    })
  })

  describe('Date Urgency Detection', () => {
    it('should detect urgent dates correctly', () => {
      expect(TaskPriorityService.isDateUrgent('2025-01-15T10:00:00.000Z', dateContext)).toBe(true)
      expect(TaskPriorityService.isDateUrgent('2025-01-16T10:00:00.000Z', dateContext)).toBe(true)
      expect(TaskPriorityService.isDateUrgent('2025-01-14T10:00:00.000Z', dateContext)).toBe(true)
      expect(TaskPriorityService.isDateUrgent('2025-01-17T10:00:00.000Z', dateContext)).toBe(false)
      expect(TaskPriorityService.isDateUrgent('2025-01-20T10:00:00.000Z', dateContext)).toBe(false)
    })
  })

  describe('Effective Date Calculation', () => {
    it('should use planned date when no urgent due date', () => {
      const task = makeTask({ status: 'brouillon', plannedDate: '2025-01-16T10:00:00.000Z' })
      const effectiveDate = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate?.getTime()).toBe(new Date('2025-01-16T00:00:00.000Z').getTime())
    })

    it('should prioritize urgent due dates over planned dates', () => {
      const task = makeTask({
        status: 'brouillon',
        plannedDate: '2025-01-20T10:00:00.000Z',
        dueDate: '2025-01-15T15:00:00.000Z'
      })
      const effectiveDate = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate?.getTime()).toBe(new Date('2025-01-15T00:00:00.000Z').getTime())
    })

    it('should return null when no effective date', () => {
      const task = makeTask({ dueDate: '2025-01-20T10:00:00.000Z' }) // Non-urgent due date
      const effectiveDate = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(effectiveDate).toBeNull()
    })
  })

  describe('Complex Business Scenarios', () => {
    it('should handle collected tasks correctly', () => {
      const collectedTask = makeTask({ status: 'collecte' })
      expect(TaskPriorityService.isCollectedTask(collectedTask, dateContext)).toBe(true)
      expect(TaskPriorityService.getTaskCategory(collectedTask, dateContext)).toBe('collected')
    })

    it('should handle urgent due dates that override planned dates', () => {
      const urgentDueTask = makeTask({
        status: 'brouillon',
        importance: 30,
        complexity: 2,
        points: 150,
        plannedDate: '2025-01-25T10:00:00.000Z',
        dueDate: '2025-01-16T10:00:00.000Z' // Tomorrow (urgent)
      })
      expect(TaskPriorityService.isDateUrgent(urgentDueTask.dueDate!, dateContext)).toBe(true)
      expect(TaskPriorityService.getTaskCategory(urgentDueTask, dateContext)).toBe('tomorrow')
      expect(TaskPriorityService.isTomorrowTask(urgentDueTask, dateContext)).toBe(true)
    })

    it('should handle tasks with both dates where due date is not urgent', () => {
      const nonUrgentDueTask = makeTask({
        status: 'brouillon',
        importance: 25,
        complexity: 4,
        points: 62,
        plannedDate: '2025-01-17T10:00:00.000Z', // Day after tomorrow
        dueDate: '2025-01-20T10:00:00.000Z' // Non-urgent due date
      })
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
      status: TaskStatus = 'brouillon',
      plannedDate?: string,
      dueDate?: string
    ): GenericTaskWithSubtasks<string> => makeTask({
      id,
      name,
      importance,
      complexity,
      status,
      points: TaskPriorityService.calculatePoints(importance, complexity),
      plannedDate,
      dueDate
    })

    it('should sort brouillon tasks first, then collected, then overdue', () => {
      const brouillonTask = createTestTask('brouillon', 'Brouillon', 0, 3, 'brouillon')
      const collectedTask = createTestTask('collected', 'Collected', 0, 3, 'collecte')
      const overdueTask = createTestTask('overdue', 'Overdue', 25, 5, 'brouillon', '2025-01-14T10:00:00.000Z')
      const todayTask = createTestTask('today', 'Today', 25, 5, 'brouillon', '2025-01-15T10:00:00.000Z')

      const tasks = [todayTask, collectedTask, overdueTask, brouillonTask]
      const sorted = [...tasks].sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))

      expect(sorted[0].id).toBe('brouillon')
      expect(sorted[1].id).toBe('collected')
      expect(sorted[2].id).toBe('overdue')
      expect(sorted[3].id).toBe('today')
    })

    it('should sort by importance within same category', () => {
      const highImportanceToday = createTestTask('high-today', 'High Importance Today', 40, 2, 'brouillon', '2025-01-15T10:00:00.000Z')
      const lowImportanceToday = createTestTask('low-today', 'Low Importance Today', 20, 5, 'brouillon', '2025-01-15T10:00:00.000Z')

      const tasks = [lowImportanceToday, highImportanceToday]
      const sorted = [...tasks].sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))

      expect(sorted[0].id).toBe('high-today') // importance 40 > 20
      expect(sorted[1].id).toBe('low-today')
    })

    it('should sort overdue tasks by date then importance', () => {
      const veryOverdue = createTestTask('very-overdue', 'Very Overdue', 30, 3, 'brouillon', '2025-01-13T10:00:00.000Z')
      const lessOverdue = createTestTask('less-overdue', 'Less Overdue', 40, 2, 'brouillon', '2025-01-14T10:00:00.000Z')

      const tasks = [lessOverdue, veryOverdue]
      const sorted = [...tasks].sort((a, b) => TaskPriorityService.compareTasksPriority(a, b, dateContext))

      expect(sorted[0].id).toBe('very-overdue') // More overdue comes first
      expect(sorted[1].id).toBe('less-overdue')
    })
  })
})
