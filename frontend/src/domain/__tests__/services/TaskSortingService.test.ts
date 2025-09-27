import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaskSortingService } from '../../services/TaskSortingService'
import { createMockTaskEntity, createTestDates, createTestTasksByCategory } from '../../../__tests__/utils/test-helpers'

describe('TaskSortingService', () => {
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

  describe('parseAndNormalizeDate', () => {
    it('should parse and normalize string dates', () => {
      const result = TaskSortingService.parseAndNormalizeDate('2023-06-15T15:30:00Z')
      const expected = new Date(Date.UTC(2023, 5, 15)) // June 15, 2023 at midnight UTC

      expect(result).toEqual(expected)
    })

    it('should normalize Date objects', () => {
      const input = new Date('2023-06-15T15:30:00Z')
      const result = TaskSortingService.parseAndNormalizeDate(input)
      const expected = new Date(Date.UTC(2023, 5, 15)) // June 15, 2023 at midnight UTC

      expect(result).toEqual(expected)
    })

    it('should handle different timezones consistently', () => {
      const dates = [
        '2023-06-15T00:00:00Z',
        '2023-06-15T12:00:00Z',
        '2023-06-15T23:59:59Z'
      ]

      dates.forEach(dateStr => {
        const result = TaskSortingService.parseAndNormalizeDate(dateStr)
        expect(result).toEqual(new Date(Date.UTC(2023, 5, 15)))
      })
    })
  })

  describe('sortTasksByPriority', () => {
    it('should sort tasks according to priority system', () => {
      const testTasks = createTestTasksByCategory(dates)
      const tasks = [
        testTasks.future,
        testTasks.collected,
        testTasks.today,
        testTasks.overdue,
        testTasks.tomorrow,
        testTasks.noDate
      ]

      const sorted = TaskSortingService.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('Collected Task')
      expect(sorted[1].name).toBe('Overdue Task')
      expect(sorted[2].name).toBe('Today Task')
      expect(sorted[3].name).toBe('Tomorrow Task')
      expect(sorted[4].name).toBe('No Date Task')
      expect(sorted[5].name).toBe('Future Task')
    })

    it('should sort collected tasks by points (highest first)', () => {
      const collectedTasks = [
        createMockTaskEntity({
          name: 'Low Points Collected',
          importance: 0,
          complexity: 3,
          points: 0
        }),
        createMockTaskEntity({
          name: 'High Points Collected',
          importance: 50,
          complexity: 1,
          points: 500
        }),
        createMockTaskEntity({
          name: 'Medium Points Collected',
          importance: 0,
          complexity: 3,
          points: 100
        })
      ]

      const sorted = TaskSortingService.sortTasksByPriority(collectedTasks)

      expect(sorted[0].points).toBe(500)
      expect(sorted[1].points).toBe(100)
      expect(sorted[2].points).toBe(0)
    })

    it('should sort overdue tasks by date (oldest first), then points', () => {
      const overdueTasks = [
        createMockTaskEntity({
          name: 'Recent Overdue Low Points',
          plannedDate: dates.yesterday,
          points: 50
        }),
        createMockTaskEntity({
          name: 'Old Overdue High Points',
          plannedDate: '2023-06-13T12:00:00Z', // 2 days ago
          points: 100
        }),
        createMockTaskEntity({
          name: 'Recent Overdue High Points',
          plannedDate: dates.yesterday,
          points: 100
        })
      ]

      const sorted = TaskSortingService.sortTasksByPriority(overdueTasks)

      expect(sorted[0].name).toBe('Old Overdue High Points') // Oldest first
      expect(sorted[1].name).toBe('Recent Overdue High Points') // Same date, higher points
      expect(sorted[2].name).toBe('Recent Overdue Low Points') // Same date, lower points
    })

    it('should sort today/tomorrow tasks by points', () => {
      const todayTasks = [
        createMockTaskEntity({
          name: 'Today Low',
          plannedDate: dates.today,
          points: 50
        }),
        createMockTaskEntity({
          name: 'Today High',
          plannedDate: dates.today,
          points: 200
        }),
        createMockTaskEntity({
          name: 'Today Medium',
          plannedDate: dates.today,
          points: 100
        })
      ]

      const sorted = TaskSortingService.sortTasksByPriority(todayTasks)

      expect(sorted[0].points).toBe(200)
      expect(sorted[1].points).toBe(100)
      expect(sorted[2].points).toBe(50)
    })

    it('should handle subtasks recursively', () => {
      const parentWithSubtasks = createMockTaskEntity({
        name: 'Parent Task',
        plannedDate: dates.today,
        points: 100,
        subtasks: [
          {
            id: 'sub-1',
            name: 'Subtask High',
            importance: 30,
            complexity: 3,
            points: 100,
            isCompleted: false,
            createdAt: dates.today,
            updatedAt: dates.today,
            userId: 'user-1',
            subtasks: [],
            tags: []
          },
          {
            id: 'sub-2',
            name: 'Subtask Low',
            importance: 10,
            complexity: 5,
            points: 20,
            isCompleted: false,
            createdAt: dates.today,
            updatedAt: dates.today,
            userId: 'user-1',
            subtasks: [],
            tags: []
          }
        ]
      })

      const sorted = TaskSortingService.sortTasksByPriority([parentWithSubtasks])
      const sortedSubtasks = sorted[0].subtasks

      expect(sortedSubtasks[0].points).toBe(100) // Higher points first
      expect(sortedSubtasks[1].points).toBe(20)
    })

    it('should not modify original array', () => {
      const testTasks = createTestTasksByCategory(dates)
      const originalTasks = [testTasks.today, testTasks.overdue, testTasks.future]
      const originalOrder = originalTasks.map(t => t.name)

      TaskSortingService.sortTasksByPriority(originalTasks)

      expect(originalTasks.map(t => t.name)).toEqual(originalOrder)
    })
  })

  describe('sortSubtasksByPriority', () => {
    it('should sort subtasks by points (highest first)', () => {
      const subtasks = [
        createMockTaskEntity({ name: 'Low Points', points: 20 }),
        createMockTaskEntity({ name: 'High Points', points: 100 }),
        createMockTaskEntity({ name: 'Medium Points', points: 50 })
      ]

      const sorted = TaskSortingService.sortSubtasksByPriority(subtasks)

      expect(sorted[0].points).toBe(100)
      expect(sorted[1].points).toBe(50)
      expect(sorted[2].points).toBe(20)
    })

    it('should handle nested subtasks recursively', () => {
      const deepSubtask = createMockTaskEntity({
        name: 'Deep Subtask',
        points: 150
      })

      const parentSubtask = createMockTaskEntity({
        name: 'Parent Subtask',
        points: 100,
        subtasks: [deepSubtask.rawTask]
      })

      const sorted = TaskSortingService.sortSubtasksByPriority([parentSubtask])

      expect(sorted[0].subtasks[0].points).toBe(150)
    })
  })

  describe('compareByPoints', () => {
    it('should compare tasks by points (higher first)', () => {
      const lowPointsTask = createMockTaskEntity({ points: 50 })
      const highPointsTask = createMockTaskEntity({ points: 200 })

      const result = TaskSortingService.compareByPoints(highPointsTask, lowPointsTask)

      expect(result).toBeLessThan(0) // High points task should come first
    })

    it('should handle equal points', () => {
      const task1 = createMockTaskEntity({ points: 100 })
      const task2 = createMockTaskEntity({ points: 100 })

      const result = TaskSortingService.compareByPoints(task1, task2)

      expect(result).toBe(0)
    })
  })

  describe('sortByDueDate', () => {
    it('should sort by due date ascending', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Future Task',
          plannedDate: dates.nextWeek
        }),
        createMockTaskEntity({
          name: 'Today Task',
          plannedDate: dates.today
        }),
        createMockTaskEntity({
          name: 'Tomorrow Task',
          plannedDate: dates.tomorrow
        })
      ]

      const sorted = TaskSortingService.sortByDueDate(tasks)

      expect(sorted[0].name).toBe('Today Task')
      expect(sorted[1].name).toBe('Tomorrow Task')
      expect(sorted[2].name).toBe('Future Task')
    })

    it('should put tasks without dates last', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'No Date Task',
          plannedDate: undefined
        }),
        createMockTaskEntity({
          name: 'Today Task',
          plannedDate: dates.today
        })
      ]

      const sorted = TaskSortingService.sortByDueDate(tasks)

      expect(sorted[0].name).toBe('Today Task')
      expect(sorted[1].name).toBe('No Date Task')
    })

    it('should not modify original array', () => {
      const tasks = [
        createMockTaskEntity({ name: 'Task 1' }),
        createMockTaskEntity({ name: 'Task 2' })
      ]
      const originalOrder = tasks.map(t => t.name)

      TaskSortingService.sortByDueDate(tasks)

      expect(tasks.map(t => t.name)).toEqual(originalOrder)
    })
  })

  describe('sortByCreationDate', () => {
    it('should sort by creation date (newest first)', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Old Task',
          createdAt: '2023-06-10T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'New Task',
          createdAt: '2023-06-15T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'Medium Task',
          createdAt: '2023-06-12T12:00:00Z'
        })
      ]

      const sorted = TaskSortingService.sortByCreationDate(tasks)

      expect(sorted[0].name).toBe('New Task')
      expect(sorted[1].name).toBe('Medium Task')
      expect(sorted[2].name).toBe('Old Task')
    })
  })

  describe('sortByCompletionDate', () => {
    it('should sort incomplete tasks first', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Completed Task',
          isCompleted: true,
          completedAt: '2023-06-15T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'Incomplete Task',
          isCompleted: false
        })
      ]

      const sorted = TaskSortingService.sortByCompletionDate(tasks)

      expect(sorted[0].name).toBe('Incomplete Task')
      expect(sorted[1].name).toBe('Completed Task')
    })

    it('should sort completed tasks by completion date (newest first)', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Completed Earlier',
          isCompleted: true,
          completedAt: '2023-06-10T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'Completed Later',
          isCompleted: true,
          completedAt: '2023-06-15T12:00:00Z'
        })
      ]

      const sorted = TaskSortingService.sortByCompletionDate(tasks)

      expect(sorted[0].name).toBe('Completed Later')
      expect(sorted[1].name).toBe('Completed Earlier')
    })
  })

  describe('sortByName', () => {
    it('should sort alphabetically by name', () => {
      const tasks = [
        createMockTaskEntity({ name: 'Zebra Task' }),
        createMockTaskEntity({ name: 'Alpha Task' }),
        createMockTaskEntity({ name: 'Beta Task' })
      ]

      const sorted = TaskSortingService.sortByName(tasks)

      expect(sorted[0].name).toBe('Alpha Task')
      expect(sorted[1].name).toBe('Beta Task')
      expect(sorted[2].name).toBe('Zebra Task')
    })

    it('should handle case-insensitive sorting', () => {
      const tasks = [
        createMockTaskEntity({ name: 'zebra task' }),
        createMockTaskEntity({ name: 'Alpha Task' }),
        createMockTaskEntity({ name: 'BETA task' })
      ]

      const sorted = TaskSortingService.sortByName(tasks)

      expect(sorted[0].name).toBe('Alpha Task')
      expect(sorted[1].name).toBe('BETA task')
      expect(sorted[2].name).toBe('zebra task')
    })
  })

  describe('sortByImportance', () => {
    it('should sort by importance (highest first)', () => {
      const tasks = [
        createMockTaskEntity({ importance: 10, points: 50 }),
        createMockTaskEntity({ importance: 30, points: 100 }),
        createMockTaskEntity({ importance: 20, points: 75 })
      ]

      const sorted = TaskSortingService.sortByImportance(tasks)

      expect(sorted[0].importance).toBe(30)
      expect(sorted[1].importance).toBe(20)
      expect(sorted[2].importance).toBe(10)
    })

    it('should use points as secondary sort when importance is equal', () => {
      const tasks = [
        createMockTaskEntity({ importance: 20, points: 50 }),
        createMockTaskEntity({ importance: 20, points: 100 }),
        createMockTaskEntity({ importance: 20, points: 75 })
      ]

      const sorted = TaskSortingService.sortByImportance(tasks)

      expect(sorted[0].points).toBe(100)
      expect(sorted[1].points).toBe(75)
      expect(sorted[2].points).toBe(50)
    })
  })

  describe('sortByComplexity', () => {
    it('should sort by complexity (simplest first)', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 8, points: 50 }),
        createMockTaskEntity({ complexity: 2, points: 100 }),
        createMockTaskEntity({ complexity: 5, points: 75 })
      ]

      const sorted = TaskSortingService.sortByComplexity(tasks)

      expect(sorted[0].complexity).toBe(2)
      expect(sorted[1].complexity).toBe(5)
      expect(sorted[2].complexity).toBe(8)
    })

    it('should use points as secondary sort when complexity is equal', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 5, points: 50 }),
        createMockTaskEntity({ complexity: 5, points: 100 }),
        createMockTaskEntity({ complexity: 5, points: 75 })
      ]

      const sorted = TaskSortingService.sortByComplexity(tasks)

      expect(sorted[0].points).toBe(100) // Highest points first for same complexity
      expect(sorted[1].points).toBe(75)
      expect(sorted[2].points).toBe(50)
    })
  })

  describe('getTasksDueInRange', () => {
    it('should filter tasks due within date range', () => {
      const startDate = new Date('2023-06-15T00:00:00Z')
      const endDate = new Date('2023-06-17T00:00:00Z')

      const tasks = [
        createMockTaskEntity({
          name: 'Before Range',
          plannedDate: '2023-06-14T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'In Range 1',
          plannedDate: '2023-06-15T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'In Range 2',
          plannedDate: '2023-06-16T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'After Range',
          plannedDate: '2023-06-18T12:00:00Z'
        }),
        createMockTaskEntity({
          name: 'No Date',
          plannedDate: undefined
        })
      ]

      const filtered = TaskSortingService.getTasksDueInRange(tasks, startDate, endDate)

      expect(filtered).toHaveLength(2)
      expect(filtered.map(t => t.name)).toEqual(['In Range 1', 'In Range 2'])
    })

    it('should handle boundary dates correctly', () => {
      const startDate = new Date('2023-06-15T00:00:00Z')
      const endDate = new Date('2023-06-15T23:59:59Z')

      const tasks = [
        createMockTaskEntity({
          name: 'Exact Start',
          plannedDate: '2023-06-15T00:00:00Z'
        }),
        createMockTaskEntity({
          name: 'Exact End',
          plannedDate: '2023-06-15T23:59:59Z'
        })
      ]

      const filtered = TaskSortingService.getTasksDueInRange(tasks, startDate, endDate)

      expect(filtered).toHaveLength(2)
    })
  })

  describe('getOverdueTasks', () => {
    it('should return tasks that are overdue', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Overdue Task',
          plannedDate: dates.yesterday
        }),
        createMockTaskEntity({
          name: 'Today Task',
          plannedDate: dates.today
        }),
        createMockTaskEntity({
          name: 'Future Task',
          plannedDate: dates.tomorrow
        }),
        createMockTaskEntity({
          name: 'No Date Task',
          plannedDate: undefined
        })
      ]

      const overdue = TaskSortingService.getOverdueTasks(tasks)

      expect(overdue).toHaveLength(1)
      expect(overdue[0].name).toBe('Overdue Task')
    })

    it('should handle edge case at midnight', () => {
      const yesterdayEnd = new Date(Date.UTC(fixedDate.getUTCFullYear(), fixedDate.getUTCMonth(), fixedDate.getUTCDate() - 1, 23, 59, 59, 999)) // End of yesterday
      const tasks = [
        createMockTaskEntity({
          name: 'Just Overdue',
          plannedDate: yesterdayEnd.toISOString()
        })
      ]

      const overdue = TaskSortingService.getOverdueTasks(tasks)

      expect(overdue).toHaveLength(1)
    })
  })

  describe('getTodayTasks', () => {
    it('should return tasks due today', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Today Task 1',
          plannedDate: dates.today
        }),
        createMockTaskEntity({
          name: 'Today Task 2',
          plannedDate: '2023-06-15T15:30:00Z' // Same day, different time
        }),
        createMockTaskEntity({
          name: 'Tomorrow Task',
          plannedDate: dates.tomorrow
        })
      ]

      const todayTasks = TaskSortingService.getTodayTasks(tasks)

      expect(todayTasks).toHaveLength(2)
      expect(todayTasks.map(t => t.name)).toEqual(['Today Task 1', 'Today Task 2'])
    })
  })

  describe('getTomorrowTasks', () => {
    it('should return tasks due tomorrow', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Today Task',
          plannedDate: dates.today
        }),
        createMockTaskEntity({
          name: 'Tomorrow Task 1',
          plannedDate: dates.tomorrow
        }),
        createMockTaskEntity({
          name: 'Tomorrow Task 2',
          plannedDate: '2023-06-16T15:30:00Z' // Same day, different time
        })
      ]

      const tomorrowTasks = TaskSortingService.getTomorrowTasks(tasks)

      expect(tomorrowTasks).toHaveLength(2)
      expect(tomorrowTasks.map(t => t.name)).toEqual(['Tomorrow Task 1', 'Tomorrow Task 2'])
    })
  })

  describe('getCollectedTasks', () => {
    it('should return collected tasks', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Collected Default',
          importance: 0,
          complexity: 3,
          points: 0
        }),
        createMockTaskEntity({
          name: 'Collected High Priority',
          importance: 50,
          complexity: 1,
          points: 500
        }),
        createMockTaskEntity({
          name: 'Regular Task',
          importance: 25,
          complexity: 5,
          points: 50
        })
      ]

      const collected = TaskSortingService.getCollectedTasks(tasks)

      expect(collected).toHaveLength(2)
      expect(collected.map(t => t.name)).toEqual(['Collected Default', 'Collected High Priority'])
    })

    it('should not return scheduled tasks even if they match collected criteria', () => {
      const tasks = [
        createMockTaskEntity({
          name: 'Scheduled Default Task',
          importance: 0,
          complexity: 3,
          points: 0,
          plannedDate: dates.today
        })
      ]

      const collected = TaskSortingService.getCollectedTasks(tasks)

      expect(collected).toHaveLength(0)
    })
  })

  describe('integration tests', () => {
    it('should work with realistic task scenarios', () => {
      const realWorldTasks = [
        createMockTaskEntity({
          name: 'Email client about project',
          importance: 35,
          complexity: 2,
          points: 175,
          plannedDate: dates.today
        }),
        createMockTaskEntity({
          name: 'Review quarterly budget',
          importance: 40,
          complexity: 7,
          points: 57,
          plannedDate: dates.yesterday // Overdue
        }),
        createMockTaskEntity({
          name: 'Plan weekend trip',
          importance: 15,
          complexity: 4,
          points: 38,
          plannedDate: dates.dayAfterTomorrow
        }),
        createMockTaskEntity({
          name: 'Random idea for app feature',
          importance: 0,
          complexity: 3,
          points: 0
        })
      ]

      const sorted = TaskSortingService.sortTasksByPriority(realWorldTasks)

      expect(sorted[0].name).toBe('Random idea for app feature') // Collected
      expect(sorted[1].name).toBe('Review quarterly budget') // Overdue
      expect(sorted[2].name).toBe('Email client about project') // Today
      expect(sorted[3].name).toBe('Plan weekend trip') // Future
    })

    it('should maintain performance with large task lists', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) =>
        createMockTaskEntity({
          name: `Task ${i}`,
          importance: Math.floor(Math.random() * 50),
          complexity: Math.floor(Math.random() * 9) + 1,
          points: Math.floor(Math.random() * 500),
          plannedDate: Math.random() > 0.5 ? dates.today : undefined
        })
      )

      const startTime = Date.now()
      const sorted = TaskSortingService.sortTasksByPriority(largeTasks)
      const endTime = Date.now()

      expect(sorted).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        [], // Empty array
        [createMockTaskEntity({ name: 'Single Task' })], // Single task
        // Tasks with extreme values
        [
          createMockTaskEntity({
            importance: 50,
            complexity: 1,
            points: 500,
            plannedDate: '1900-01-01T00:00:00Z' // Very old date
          }),
          createMockTaskEntity({
            importance: 0,
            complexity: 9,
            points: 0,
            plannedDate: '2100-01-01T00:00:00Z' // Very future date
          })
        ]
      ]

      edgeCases.forEach(tasks => {
        expect(() => TaskSortingService.sortTasksByPriority(tasks)).not.toThrow()
        expect(() => TaskSortingService.sortByDueDate(tasks)).not.toThrow()
        expect(() => TaskSortingService.sortByName(tasks)).not.toThrow()
      })
    })
  })
})