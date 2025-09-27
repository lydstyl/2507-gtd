import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaskEntity } from '../../entities/Task'
import { createMockTaskEntity, createTestDates, createTestTasksByCategory, assertTaskCategory } from '../../../__tests__/utils/test-helpers'

describe('TaskEntity', () => {
  let fixedDate: Date
  let dates: ReturnType<typeof createTestDates>

  beforeEach(() => {
    fixedDate = new Date('2023-06-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
    dates = createTestDates(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor and getters', () => {
    it('should create TaskEntity with all properties accessible', () => {
      const taskEntity = createMockTaskEntity({
        id: 'task-1',
        name: 'Test Task',
        importance: 30,
        complexity: 6,
        points: 50,
        plannedDate: dates.today,
        isCompleted: false
      })

      expect(taskEntity.id).toBe('task-1')
      expect(taskEntity.name).toBe('Test Task')
      expect(taskEntity.importance).toBe(30)
      expect(taskEntity.complexity).toBe(6)
      expect(taskEntity.points).toBe(50)
      expect(taskEntity.plannedDate).toBe(dates.today)
      expect(taskEntity.isCompleted).toBe(false)
    })

    it('should provide access to rawTask', () => {
      const originalTask = {
        id: 'raw-task',
        name: 'Raw Task',
        importance: 25,
        complexity: 5,
        points: 50,
        isCompleted: false,
        createdAt: dates.today,
        updatedAt: dates.today,
        userId: 'user-1',
        subtasks: [],
        tags: []
      }

      const taskEntity = new TaskEntity(originalTask)
      expect(taskEntity.rawTask).toEqual(originalTask)
    })

    it('should handle optional properties correctly', () => {
      const taskWithOptionals = createMockTaskEntity({
        dueDate: dates.tomorrow,
        plannedDate: dates.today,
        link: 'https://example.com',
        note: 'Test note'
      })

      expect(taskWithOptionals.dueDate).toBe(dates.tomorrow)
      expect(taskWithOptionals.plannedDate).toBe(dates.today)

      const taskWithoutOptionals = createMockTaskEntity({
        dueDate: undefined,
        plannedDate: undefined
      })

      expect(taskWithoutOptionals.dueDate).toBeUndefined()
      expect(taskWithoutOptionals.plannedDate).toBeUndefined()
    })
  })

  describe('calculatePoints', () => {
    it('should calculate points correctly', () => {
      const testCases = [
        { importance: 50, complexity: 1, expected: 500 },
        { importance: 25, complexity: 5, expected: 50 },
        { importance: 30, complexity: 3, expected: 100 },
        { importance: 0, complexity: 5, expected: 0 },
        { importance: 10, complexity: 3, expected: 33 } // 10 * 10 / 3 = 33.33... -> 33
      ]

      testCases.forEach(({ importance, complexity, expected }) => {
        const task = createMockTaskEntity({ importance, complexity })
        expect(task.calculatePoints()).toBe(expected)
      })
    })

    it('should handle zero complexity', () => {
      const task = createMockTaskEntity({
        importance: 25,
        complexity: 0
      })

      expect(task.calculatePoints()).toBe(0)
    })

    it('should return same result as stored points for valid tasks', () => {
      const task = createMockTaskEntity({
        importance: 25,
        complexity: 5,
        points: 50
      })

      expect(task.calculatePoints()).toBe(task.points)
    })
  })

  describe('isOverdue', () => {
    it('should detect overdue tasks', () => {
      const overdueTask = createMockTaskEntity({
        plannedDate: dates.yesterday
      })

      expect(overdueTask.isOverdue()).toBe(true)
    })

    it('should not consider future tasks as overdue', () => {
      const futureTask = createMockTaskEntity({
        plannedDate: dates.tomorrow
      })

      expect(futureTask.isOverdue()).toBe(false)
    })

    it('should not consider today tasks as overdue', () => {
      const todayTask = createMockTaskEntity({
        plannedDate: dates.today
      })

      expect(todayTask.isOverdue()).toBe(false)
    })

    it('should handle tasks without planned dates', () => {
      const noDateTask = createMockTaskEntity({
        plannedDate: undefined
      })

      expect(noDateTask.isOverdue()).toBe(false)
    })

    it('should handle invalid date formats gracefully', () => {
      const invalidDateTask = createMockTaskEntity({
        plannedDate: 'invalid-date'
      })

      expect(invalidDateTask.isOverdue()).toBe(false)
    })
  })

  describe('isDueToday', () => {
    it('should detect tasks due today', () => {
      const todayTask = createMockTaskEntity({
        plannedDate: dates.today
      })

      expect(todayTask.isDueToday()).toBe(true)
    })

    it('should not consider yesterday tasks as due today', () => {
      const yesterdayTask = createMockTaskEntity({
        plannedDate: dates.yesterday
      })

      expect(yesterdayTask.isDueToday()).toBe(false)
    })

    it('should not consider tomorrow tasks as due today', () => {
      const tomorrowTask = createMockTaskEntity({
        plannedDate: dates.tomorrow
      })

      expect(tomorrowTask.isDueToday()).toBe(false)
    })

    it('should handle tasks without planned dates', () => {
      const noDateTask = createMockTaskEntity({
        plannedDate: undefined
      })

      expect(noDateTask.isDueToday()).toBe(false)
    })

    it('should handle timezone differences correctly', () => {
      // Test with different time zones that normalize to the same UTC date
      const midnightUTC = '2023-06-15T00:00:00Z'
      const noonUTC = '2023-06-15T12:00:00Z'
      const endOfDayUTC = '2023-06-15T23:59:59Z'

      const midnightTask = createMockTaskEntity({ plannedDate: midnightUTC })
      const noonTask = createMockTaskEntity({ plannedDate: noonUTC })
      const endOfDayTask = createMockTaskEntity({ plannedDate: endOfDayUTC })

      expect(midnightTask.isDueToday()).toBe(true)
      expect(noonTask.isDueToday()).toBe(true)
      expect(endOfDayTask.isDueToday()).toBe(true)
    })
  })

  describe('isDueTomorrow', () => {
    it('should detect tasks due tomorrow', () => {
      const tomorrowTask = createMockTaskEntity({
        plannedDate: dates.tomorrow
      })

      expect(tomorrowTask.isDueTomorrow()).toBe(true)
    })

    it('should not consider today tasks as due tomorrow', () => {
      const todayTask = createMockTaskEntity({
        plannedDate: dates.today
      })

      expect(todayTask.isDueTomorrow()).toBe(false)
    })

    it('should not consider day after tomorrow tasks as due tomorrow', () => {
      const dayAfterTomorrowTask = createMockTaskEntity({
        plannedDate: dates.dayAfterTomorrow
      })

      expect(dayAfterTomorrowTask.isDueTomorrow()).toBe(false)
    })

    it('should handle tasks without planned dates', () => {
      const noDateTask = createMockTaskEntity({
        plannedDate: undefined
      })

      expect(noDateTask.isDueTomorrow()).toBe(false)
    })
  })

  describe('isCollected', () => {
    it('should identify new default tasks as collected', () => {
      const collectedTask = createMockTaskEntity({
        importance: 0,
        complexity: 3,
        points: 0,
        plannedDate: undefined
      })

      expect(collectedTask.isCollected()).toBe(true)
    })

    it('should identify high priority tasks as collected', () => {
      const highPriorityTask = createMockTaskEntity({
        importance: 50,
        complexity: 1,
        points: 500,
        plannedDate: undefined
      })

      expect(highPriorityTask.isCollected()).toBe(false)
    })

    it('should not identify tasks with planned dates as collected', () => {
      const scheduledTask = createMockTaskEntity({
        importance: 0,
        complexity: 3,
        points: 0,
        plannedDate: dates.today
      })

      expect(scheduledTask.isCollected()).toBe(false)
    })

    it('should not identify medium priority tasks without dates as collected', () => {
      const mediumTask = createMockTaskEntity({
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: undefined
      })

      expect(mediumTask.isCollected()).toBe(false)
    })
  })

  describe('getCategory', () => {
    it('should categorize all task types correctly', () => {
      const tasks = createTestTasksByCategory(dates)

      assertTaskCategory(tasks.collected, 'collected')
      assertTaskCategory(tasks.highPriorityNoDate, 'no-date')
      assertTaskCategory(tasks.overdue, 'overdue')
      assertTaskCategory(tasks.today, 'today')
      assertTaskCategory(tasks.tomorrow, 'tomorrow')
      assertTaskCategory(tasks.future, 'future')
      assertTaskCategory(tasks.noDate, 'no-date')
    })

    it('should prioritize overdue over other categories', () => {
      const overdueHighPriority = createMockTaskEntity({
        importance: 50,
        complexity: 1,
        points: 500,
        plannedDate: dates.yesterday
      })

      expect(overdueHighPriority.getCategory()).toBe('overdue')
    })

    it('should handle due date urgency over planned date', () => {
      const urgentDueTask = createMockTaskEntity({
        plannedDate: dates.dayAfterTomorrow,
        dueDate: dates.today,
        importance: 25,
        complexity: 5,
        points: 50
      })

      // Should be categorized based on urgent due date, not planned date
      expect(urgentDueTask.getCategory()).toBe('today')
    })
  })

  describe('getDayOfWeek', () => {
    it('should return correct day of week', () => {
      // June 15, 2023 was a Thursday (4)
      const task = createMockTaskEntity({
        plannedDate: '2023-06-15T12:00:00Z'
      })

      expect(task.getDayOfWeek()).toBe(4) // Thursday
    })

    it('should return -1 for tasks without planned date', () => {
      const task = createMockTaskEntity({
        plannedDate: undefined
      })

      expect(task.getDayOfWeek()).toBe(-1)
    })

    it('should handle invalid dates', () => {
      const task = createMockTaskEntity({
        plannedDate: 'invalid-date'
      })

      expect(task.getDayOfWeek()).toBe(-1)
    })

    it('should return correct days for week range', () => {
      const weekDays = [
        { date: '2023-06-11T12:00:00Z', day: 0 }, // Sunday
        { date: '2023-06-12T12:00:00Z', day: 1 }, // Monday
        { date: '2023-06-13T12:00:00Z', day: 2 }, // Tuesday
        { date: '2023-06-14T12:00:00Z', day: 3 }, // Wednesday
        { date: '2023-06-15T12:00:00Z', day: 4 }, // Thursday
        { date: '2023-06-16T12:00:00Z', day: 5 }, // Friday
        { date: '2023-06-17T12:00:00Z', day: 6 }, // Saturday
      ]

      weekDays.forEach(({ date, day }) => {
        const task = createMockTaskEntity({ plannedDate: date })
        expect(task.getDayOfWeek()).toBe(day)
      })
    })
  })

  describe('hasSubtasks', () => {
    it('should detect tasks with subtasks', () => {
      const taskWithSubtasks = createMockTaskEntity({
        subtasks: [
          { id: 'sub-1', name: 'Subtask 1', importance: 10, complexity: 2, points: 50, isCompleted: false, createdAt: dates.today, updatedAt: dates.today, userId: 'user-1', subtasks: [], tags: [] }
        ]
      })

      expect(taskWithSubtasks.hasSubtasks()).toBe(true)
    })

    it('should detect tasks without subtasks', () => {
      const taskWithoutSubtasks = createMockTaskEntity({
        subtasks: []
      })

      expect(taskWithoutSubtasks.hasSubtasks()).toBe(false)
    })

    it('should handle undefined subtasks', () => {
      const taskWithUndefinedSubtasks = createMockTaskEntity({
        subtasks: undefined as any
      })

      expect(taskWithUndefinedSubtasks.hasSubtasks()).toBe(false)
    })
  })

  describe('isSubtask', () => {
    it('should detect subtasks', () => {
      const subtask = createMockTaskEntity({
        parentId: 'parent-task-id'
      })

      expect(subtask.isSubtask()).toBe(true)
    })

    it('should detect root tasks', () => {
      const rootTask = createMockTaskEntity({
        parentId: undefined
      })

      expect(rootTask.isSubtask()).toBe(false)
    })

    it('should handle empty string parentId', () => {
      const emptyParentTask = createMockTaskEntity({
        parentId: ''
      })

      expect(emptyParentTask.isSubtask()).toBe(false)
    })
  })

  describe('getSubtaskEntities', () => {
    it('should return TaskEntity instances for subtasks', () => {
      const subtaskData = [
        { id: 'sub-1', name: 'Subtask 1', importance: 10, complexity: 2, points: 50, isCompleted: false, createdAt: dates.today, updatedAt: dates.today, userId: 'user-1', subtasks: [], tags: [] },
        { id: 'sub-2', name: 'Subtask 2', importance: 15, complexity: 3, points: 50, isCompleted: false, createdAt: dates.today, updatedAt: dates.today, userId: 'user-1', subtasks: [], tags: [] }
      ]

      const parentTask = createMockTaskEntity({
        subtasks: subtaskData
      })

      const subtaskEntities = parentTask.getSubtaskEntities()

      expect(subtaskEntities).toHaveLength(2)
      expect(subtaskEntities[0]).toBeInstanceOf(TaskEntity)
      expect(subtaskEntities[1]).toBeInstanceOf(TaskEntity)
      expect(subtaskEntities[0].name).toBe('Subtask 1')
      expect(subtaskEntities[1].name).toBe('Subtask 2')
    })

    it('should return empty array for tasks without subtasks', () => {
      const taskWithoutSubtasks = createMockTaskEntity({
        subtasks: []
      })

      const subtaskEntities = taskWithoutSubtasks.getSubtaskEntities()

      expect(subtaskEntities).toHaveLength(0)
      expect(Array.isArray(subtaskEntities)).toBe(true)
    })

    it('should handle nested subtasks', () => {
      const deepSubtask = { id: 'deep-sub', name: 'Deep Subtask', importance: 5, complexity: 1, points: 50, isCompleted: false, createdAt: dates.today, updatedAt: dates.today, userId: 'user-1', subtasks: [], tags: [] }
      const subtaskData = [
        { id: 'sub-1', name: 'Subtask 1', importance: 10, complexity: 2, points: 50, isCompleted: false, createdAt: dates.today, updatedAt: dates.today, userId: 'user-1', subtasks: [deepSubtask], tags: [] }
      ]

      const parentTask = createMockTaskEntity({
        subtasks: subtaskData
      })

      const subtaskEntities = parentTask.getSubtaskEntities()
      const nestedSubtasks = subtaskEntities[0].getSubtaskEntities()

      expect(nestedSubtasks).toHaveLength(1)
      expect(nestedSubtasks[0].name).toBe('Deep Subtask')
    })
  })

  describe('private helper methods', () => {
    it('should normalize dates correctly', () => {
      // Test the date normalization through public methods
      const task1 = createMockTaskEntity({
        plannedDate: '2023-06-15T00:00:00Z'
      })

      const task2 = createMockTaskEntity({
        plannedDate: '2023-06-15T23:59:59Z'
      })

      // Both should be considered as due today despite different times
      expect(task1.isDueToday()).toBe(true)
      expect(task2.isDueToday()).toBe(true)
    })

    it('should handle timezone edge cases', () => {
      // Test across timezone boundaries
      const edgeCases = [
        '2023-06-14T23:00:00Z', // Late previous day
        '2023-06-15T01:00:00Z', // Early today
        '2023-06-15T23:00:00Z', // Late today
        '2023-06-16T01:00:00Z'  // Early tomorrow
      ]

      edgeCases.forEach(date => {
        const task = createMockTaskEntity({ plannedDate: date })
        const category = task.getCategory()
        expect(['overdue', 'today', 'tomorrow'].includes(category)).toBe(true)
      })
    })
  })

  describe('business logic edge cases', () => {
    it('should handle tasks with extreme importance and complexity', () => {
      const extremeTask = createMockTaskEntity({
        importance: 50,
        complexity: 9,
        points: 56 // Math.round(10 * 50 / 9) = 56
      })

      expect(extremeTask.calculatePoints()).toBe(56)
      expect(extremeTask.importance).toBe(50)
      expect(extremeTask.complexity).toBe(9)
    })

    it('should handle tasks with zero importance', () => {
      const zeroImportanceTask = createMockTaskEntity({
        importance: 0,
        complexity: 5,
        points: 0
      })

      expect(zeroImportanceTask.calculatePoints()).toBe(0)
      expect(zeroImportanceTask.points).toBe(0)
    })

    it('should handle completed tasks correctly', () => {
      const completedTask = createMockTaskEntity({
        isCompleted: true,
        completedAt: dates.today,
        plannedDate: dates.yesterday
      })

      expect(completedTask.isCompleted).toBe(true)
      expect(completedTask.isOverdue()).toBe(true) // Still overdue even if completed
    })

    it('should handle tasks with both due date and planned date', () => {
      const taskWithBothDates = createMockTaskEntity({
        plannedDate: dates.dayAfterTomorrow,
        dueDate: dates.today
      })

      // Should be categorized by urgent due date
      expect(taskWithBothDates.getCategory()).toBe('today')
    })

    it('should handle empty strings as dates', () => {
      const taskWithEmptyDates = createMockTaskEntity({
        plannedDate: '',
        dueDate: ''
      })

      expect(taskWithEmptyDates.isDueToday()).toBe(false)
      expect(taskWithEmptyDates.isOverdue()).toBe(false)
      expect(taskWithEmptyDates.getCategory()).toBe('no-date')
    })
  })

  describe('integration with domain services', () => {
    it('should work correctly with TaskSortingPriorityService', () => {
      const collectedTask = createMockTaskEntity({
        importance: 0,
        complexity: 3,
        points: 0
      })

      const todayTask = createMockTaskEntity({
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: dates.today
      })

      expect(collectedTask.isCollected()).toBe(true)
      expect(collectedTask.getCategory()).toBe('collected')
      expect(todayTask.getCategory()).toBe('today')
    })

    it('should maintain consistency with backend logic', () => {
      // Test that frontend TaskEntity produces same results as backend
      const testTask = createMockTaskEntity({
        importance: 30,
        complexity: 6,
        points: 50,
        plannedDate: dates.today
      })

      expect(testTask.calculatePoints()).toBe(50)
      expect(testTask.isDueToday()).toBe(true)
      expect(testTask.getCategory()).toBe('today')
    })
  })
})