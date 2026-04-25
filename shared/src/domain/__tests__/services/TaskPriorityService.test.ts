import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaskPriorityService } from '../../services/TaskPriorityService'
import { GenericTaskWithSubtasks, DateContext } from '../../entities/TaskTypes'

describe('Shared TaskPriorityService', () => {
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

    it('should be consistent across calls', () => {
      const context1 = TaskPriorityService.createDateContext()
      const context2 = TaskPriorityService.createDateContext()

      expect(context1.today).toEqual(context2.today)
      expect(context1.tomorrow).toEqual(context2.tomorrow)
      expect(context1.dayAfterTomorrow).toEqual(context2.dayAfterTomorrow)
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

    it('should handle different timezones consistently', () => {
      const times = [
        '2023-06-15T00:00:00Z',
        '2023-06-15T12:00:00Z',
        '2023-06-15T23:59:59Z'
      ]

      times.forEach(time => {
        const result = TaskPriorityService.normalizeDate(time)
        expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
      })
    })

    it('should work with both string and Date inputs', () => {
      const stringInput = '2023-06-15T15:30:00Z'
      const dateInput = new Date('2023-06-15T15:30:00Z')

      const stringResult = TaskPriorityService.normalizeDate(stringInput)
      const dateResult = TaskPriorityService.normalizeDate(dateInput)

      expect(stringResult).toEqual(dateResult)
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

    it('should work with both string and Date inputs', () => {
      expect(TaskPriorityService.isDateUrgent(today, dateContext)).toBe(true)
      expect(TaskPriorityService.isDateUrgent(today.toISOString(), dateContext)).toBe(true)
    })

    it('should handle invalid dates gracefully', () => {
      expect(TaskPriorityService.isDateUrgent('invalid-date', dateContext)).toBe(false)
    })
  })

  describe('getEffectiveDate', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    it('should return due date if urgent', () => {
      const task = createTestTask({
        plannedDate: dayAfterTomorrow.toISOString(),
        dueDate: today.toISOString()
      })

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toEqual(today)
    })

    it('should return planned date if due date is not urgent', () => {
      const task = createTestTask({
        plannedDate: today.toISOString(),
        dueDate: dayAfterTomorrow.toISOString()
      })

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toEqual(today)
    })

    it('should return null if no dates', () => {
      const task = createTestTask({})

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toBeNull()
    })

    it('should work with Date objects', () => {
      const task = createTestTask({
        plannedDate: today,
        dueDate: tomorrow
      })

      const result = TaskPriorityService.getEffectiveDate(task, dateContext)
      expect(result).toEqual(tomorrow) // Due date is urgent, so it should be returned
    })
  })

  describe('isCollectedTask', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    it('should identify tasks with status=collecte as collected', () => {
      const task = createTestTask({ status: 'collecte' as any })
      expect(TaskPriorityService.isCollectedTask(task, dateContext)).toBe(true)
    })

    it('should not identify brouillon tasks as collected', () => {
      const task = createTestTask({ status: 'brouillon' as any })
      expect(TaskPriorityService.isCollectedTask(task, dateContext)).toBe(false)
    })

    it('should not identify tasks without collecte status as collected', () => {
      const task = createTestTask({ status: 'pour_ia' as any })
      expect(TaskPriorityService.isCollectedTask(task, dateContext)).toBe(false)
    })
  })

  describe('task status checks', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    describe('isOverdueTask', () => {
      it('should detect overdue tasks', () => {
        const task = createTestTask({
          plannedDate: yesterday.toISOString()
        })

        expect(TaskPriorityService.isOverdueTask(task, dateContext)).toBe(true)
      })

      it('should not consider future tasks as overdue', () => {
        const task = createTestTask({
          plannedDate: tomorrow.toISOString()
        })

        expect(TaskPriorityService.isOverdueTask(task, dateContext)).toBe(false)
      })

      it('should handle tasks without dates', () => {
        const task = createTestTask({})

        expect(TaskPriorityService.isOverdueTask(task, dateContext)).toBe(false)
      })
    })

    describe('isTodayTask', () => {
      it('should detect today tasks', () => {
        const task = createTestTask({
          plannedDate: today.toISOString()
        })

        expect(TaskPriorityService.isTodayTask(task, dateContext)).toBe(true)
      })

      it('should not consider other days as today', () => {
        const task = createTestTask({
          plannedDate: tomorrow.toISOString()
        })

        expect(TaskPriorityService.isTodayTask(task, dateContext)).toBe(false)
      })
    })

    describe('isTomorrowTask', () => {
      it('should detect tomorrow tasks', () => {
        const task = createTestTask({
          plannedDate: tomorrow.toISOString()
        })

        expect(TaskPriorityService.isTomorrowTask(task, dateContext)).toBe(true)
      })

      it('should not consider other days as tomorrow', () => {
        const task = createTestTask({
          plannedDate: today.toISOString()
        })

        expect(TaskPriorityService.isTomorrowTask(task, dateContext)).toBe(false)
      })
    })

    describe('isFutureTask', () => {
      it('should detect future tasks', () => {
        const task = createTestTask({
          plannedDate: dayAfterTomorrow.toISOString()
        })

        expect(TaskPriorityService.isFutureTask(task, dateContext)).toBe(true)
      })

      it('should not consider today/tomorrow as future', () => {
        const todayTask = createTestTask({
          plannedDate: today.toISOString()
        })

        const tomorrowTask = createTestTask({
          plannedDate: tomorrow.toISOString()
        })

        expect(TaskPriorityService.isFutureTask(todayTask, dateContext)).toBe(false)
        expect(TaskPriorityService.isFutureTask(tomorrowTask, dateContext)).toBe(false)
      })
    })
  })

  describe('getTaskCategory', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    it('should categorize all task types correctly', () => {
      const testCases = [
        {
          task: createTestTask({ status: 'collecte' as any }),
          expected: 'collected'
        },
        {
          task: createTestTask({ status: 'pour_ia' as any }),
          expected: 'pour-ia'
        },
        {
          task: createTestTask({ status: 'un_jour_peut_etre' as any }),
          expected: 'un-jour'
        },
        {
          task: createTestTask({ plannedDate: yesterday.toISOString() }),
          expected: 'overdue'
        },
        {
          task: createTestTask({ plannedDate: today.toISOString() }),
          expected: 'today'
        },
        {
          task: createTestTask({ plannedDate: tomorrow.toISOString() }),
          expected: 'tomorrow'
        },
        {
          task: createTestTask({ plannedDate: dayAfterTomorrow.toISOString() }),
          expected: 'future'
        },
        {
          task: createTestTask({ importance: 25, complexity: 5, points: 50 }),
          expected: 'brouillon' // brouillon with no date → brouillon category
        }
      ]

      testCases.forEach(({ task, expected }) => {
        expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe(expected)
      })
    })

    it('should apply date-based categorization for brouillon tasks with dates', () => {
      const overdueTask = createTestTask({ plannedDate: yesterday.toISOString() })
      expect(TaskPriorityService.getTaskCategory(overdueTask, dateContext)).toBe('overdue')
    })

    it('should work with Date objects', () => {
      const task = createTestTask({ plannedDate: today })
      expect(TaskPriorityService.getTaskCategory(task, dateContext)).toBe('today')
    })
  })

  describe('category utilities', () => {
    it('should return correct priority order', () => {
      expect(TaskPriorityService.getCategoryPriority('brouillon')).toBe(1)
      expect(TaskPriorityService.getCategoryPriority('pour-ia')).toBe(2)
      expect(TaskPriorityService.getCategoryPriority('collected')).toBe(3)
      expect(TaskPriorityService.getCategoryPriority('overdue')).toBe(4)
      expect(TaskPriorityService.getCategoryPriority('today')).toBe(5)
      expect(TaskPriorityService.getCategoryPriority('tomorrow')).toBe(6)
      expect(TaskPriorityService.getCategoryPriority('no-date')).toBe(7)
      expect(TaskPriorityService.getCategoryPriority('future')).toBe(8)
      expect(TaskPriorityService.getCategoryPriority('un-jour')).toBe(9)
    })

    it('should compare categories correctly', () => {
      function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
        return {
          id: 'test-task',
          name: 'Test Task',
          importance: 25,
          complexity: 5,
          points: 50,
          status: 'brouillon' as any,
          plannedDate: undefined,
          dueDate: undefined,
          parentId: undefined,
          userId: 'user-1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2023-06-15T10:00:00Z' as TDate,
          updatedAt: '2023-06-15T10:00:00Z' as TDate,
          subtasks: [],
          tags: [],
          ...overrides
        } as GenericTaskWithSubtasks<TDate>
      }

      const collectedTask = createTestTask({ status: 'collecte' as any })
      const todayTask = createTestTask({ plannedDate: today.toISOString() })

      const comparison = TaskPriorityService.compareByCategory(collectedTask, todayTask, dateContext)
      expect(comparison).toBeLessThan(0) // Collected (priority 3) should come before today (priority 5)
    })
  })

  describe('comparison functions', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    describe('compareByImportance', () => {
      it('should compare by importance (higher first)', () => {
        const highTask = createTestTask({ importance: 100 })
        const lowTask = createTestTask({ importance: 50 })

        const result = TaskPriorityService.compareByImportance(highTask, lowTask)
        expect(result).toBeLessThan(0)
      })

      it('should use creation date as tiebreaker', () => {
        const newerTask = createTestTask({
          importance: 50,
          createdAt: '2023-06-15T12:00:00Z'
        })

        const olderTask = createTestTask({
          importance: 50,
          createdAt: '2023-06-14T12:00:00Z'
        })

        const result = TaskPriorityService.compareByImportance(newerTask, olderTask)
        expect(result).toBeLessThan(0)
      })
    })

    describe('compareByPoints (legacy → delegates to compareByImportance)', () => {
      it('should compare by importance (higher first)', () => {
        const highTask = createTestTask({ importance: 100, points: 100 })
        const lowTask = createTestTask({ importance: 50, points: 50 })

        const result = TaskPriorityService.compareByPoints(highTask, lowTask)
        expect(result).toBeLessThan(0)
      })
    })

    describe('compareByEffectiveDate', () => {
      it('should compare by effective date (ascending)', () => {
        const earlierTask = createTestTask({ plannedDate: today.toISOString() })
        const laterTask = createTestTask({ plannedDate: tomorrow.toISOString() })

        const result = TaskPriorityService.compareByEffectiveDate(earlierTask, laterTask, dateContext)
        expect(result).toBeLessThan(0) // Earlier task should come first
      })

      it('should handle tasks without dates', () => {
        const taskWithDate = createTestTask({ plannedDate: today.toISOString() })
        const taskWithoutDate = createTestTask({})

        const result = TaskPriorityService.compareByEffectiveDate(taskWithDate, taskWithoutDate, dateContext)
        expect(result).toBeLessThan(0) // Task with date should come first
      })
    })
  })

  describe('comprehensive priority comparison', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    it('should implement complete sorting algorithm', () => {
      const tasks = [
        createTestTask({ plannedDate: dayAfterTomorrow.toISOString() }), // future (brouillon + date)
        createTestTask({ status: 'collecte' as any }), // collected
        createTestTask({ plannedDate: today.toISOString() }), // today (brouillon + date)
        createTestTask({ plannedDate: yesterday.toISOString() }), // overdue (brouillon + date)
        createTestTask({ plannedDate: tomorrow.toISOString() }), // tomorrow (brouillon + date)
        createTestTask({ }) // brouillon (no date)
      ]

      const sorted = [...tasks].sort((a, b) =>
        TaskPriorityService.compareTasksPriority(a, b, dateContext)
      )

      expect(TaskPriorityService.getTaskCategory(sorted[0], dateContext)).toBe('brouillon')
      expect(TaskPriorityService.getTaskCategory(sorted[1], dateContext)).toBe('collected')
      expect(TaskPriorityService.getTaskCategory(sorted[2], dateContext)).toBe('overdue')
      expect(TaskPriorityService.getTaskCategory(sorted[3], dateContext)).toBe('today')
      expect(TaskPriorityService.getTaskCategory(sorted[4], dateContext)).toBe('tomorrow')
      expect(TaskPriorityService.getTaskCategory(sorted[5], dateContext)).toBe('future')
    })

    it('should sort within categories correctly', () => {
      // Test overdue tasks (should sort by date ASC, then importance DESC)
      const veryOverdue = createTestTask({
        plannedDate: new Date(Date.UTC(2023, 5, 13)).toISOString(),
        importance: 100
      })

      const recentlyOverdue = createTestTask({
        plannedDate: yesterday.toISOString(),
        importance: 200
      })

      const result = TaskPriorityService.compareTasksPriority(veryOverdue, recentlyOverdue, dateContext)
      expect(result).toBeLessThan(0) // Very overdue should come first
    })

    it('should handle edge cases gracefully', () => {
      const taskWithNullDate = createTestTask({ plannedDate: undefined })
      const taskWithValidDate = createTestTask({ plannedDate: today.toISOString() })

      expect(() => {
        TaskPriorityService.compareTasksPriority(taskWithNullDate, taskWithValidDate, dateContext)
      }).not.toThrow()
    })
  })

  describe('cross-platform compatibility', () => {
    function createTestTask<TDate extends string | Date>(overrides: Partial<GenericTaskWithSubtasks<TDate>> = {}): GenericTaskWithSubtasks<TDate> {
      return {
        id: 'test-task',
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        status: 'brouillon' as any,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2023-06-15T10:00:00Z' as TDate,
        updatedAt: '2023-06-15T10:00:00Z' as TDate,
        subtasks: [],
        tags: [],
        ...overrides
      } as GenericTaskWithSubtasks<TDate>
    }

    it('should work with string dates (frontend)', () => {
      const stringTask = createTestTask({
        plannedDate: '2023-06-15T12:00:00Z',
        createdAt: '2023-06-15T10:00:00Z'
      })

      expect(TaskPriorityService.getTaskCategory(stringTask, dateContext)).toBe('today')
    })

    it('should work with Date objects (backend)', () => {
      const dateTask = createTestTask({
        plannedDate: today,
        createdAt: today
      })

      expect(TaskPriorityService.getTaskCategory(dateTask, dateContext)).toBe('today')
    })

    it('should produce consistent results regardless of date type', () => {
      const stringDateTask = createTestTask({
        plannedDate: '2023-06-15T12:00:00Z'
      })

      const dateObjectTask = createTestTask({
        plannedDate: new Date('2023-06-15T12:00:00Z')
      })

      const stringCategory = TaskPriorityService.getTaskCategory(stringDateTask, dateContext)
      const dateCategory = TaskPriorityService.getTaskCategory(dateObjectTask, dateContext)

      expect(stringCategory).toBe(dateCategory)
    })
  })
})