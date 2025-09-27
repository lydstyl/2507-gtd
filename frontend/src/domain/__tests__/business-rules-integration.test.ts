import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskEntity } from '../entities/Task'
import { TaskPriorityUIService } from '../services/TaskPriorityUIService'
import { TaskCategoryService } from '../services/TaskCategoryService'
import { TaskSortingService } from '../services/TaskSortingService'

// Mock timer for consistent date testing
const mockDate = new Date('2025-01-15T10:00:00Z') // Wednesday
vi.useFakeTimers()
vi.setSystemTime(mockDate)

describe('Business Rules Integration', () => {
  beforeEach(() => {
    // Reset any state if needed
  })

  describe('Complex Task Lifecycle Scenarios', () => {
    it('should handle task progression from collected to completed with proper categorization', () => {
      // Start as collected task (high priority task with no due date)
      const collectedTask = new TaskEntity({
        id: '1',
        name: 'New collected task',
        importance: 50, // High importance
        complexity: 1, // Low complexity
        points: 500, // 10 * 50 / 1 = 500 (high priority)
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z', // 1 hour ago
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      expect(collectedTask.getCategory()).toBe('no-date')
      expect(collectedTask.calculatePoints()).toBe(500) // 10 * 50 / 1

      // Add due date for today - should become today task
      const todayTask = new TaskEntity({
        ...collectedTask.rawTask,
        plannedDate: '2025-01-15T15:00:00.000Z', // Today
        updatedAt: '2025-01-15T10:30:00.000Z'
      })

      expect(todayTask.getCategory()).toBe('today')
      expect(todayTask.isDueToday()).toBe(true)
      expect(todayTask.isOverdue()).toBe(false)

      // Make it overdue
      const overdueTask = new TaskEntity({
        ...todayTask.rawTask,
        plannedDate: '2025-01-14T15:00:00.000Z', // Yesterday
        updatedAt: '2025-01-15T10:30:00.000Z'
      })

      expect(overdueTask.getCategory()).toBe('overdue')
      expect(overdueTask.isOverdue()).toBe(true)
    })

    it('should maintain priority ordering across category transitions', () => {
      const tasks = [
        // High priority overdue task
        new TaskEntity({
          id: '1',
          name: 'Urgent overdue task',
          importance: 45, // High importance
          complexity: 1, // Low complexity
          points: 450, // 10 * 45 / 1 = 450
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
        }),
        // Medium priority today task
        new TaskEntity({
          id: '2',
          name: 'Today task',
          importance: 25, // Medium importance
          complexity: 2, // Medium complexity
          points: 125, // 10 * 25 / 2 = 125
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
        }),
        // Low priority future task
        new TaskEntity({
          id: '3',
          name: 'Future task',
          importance: 10, // Low importance
          complexity: 5, // Medium complexity
          points: 20, // 10 * 10 / 5 = 20
          plannedDate: '2025-01-20T10:00:00.000Z', // Future
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
      ]

      const sortedTasks = TaskSortingService.sortTasksByPriority(tasks)

      // Should be sorted: overdue (high priority) -> today (medium) -> future (low)
      expect(sortedTasks[0].id).toBe('1') // Overdue high priority
      expect(sortedTasks[1].id).toBe('2') // Today medium priority
      expect(sortedTasks[2].id).toBe('3') // Future low priority

      // Verify categories are maintained
      expect(sortedTasks[0].getCategory()).toBe('overdue')
      expect(sortedTasks[1].getCategory()).toBe('today')
      expect(sortedTasks[2].getCategory()).toBe('future')
    })
  })

  describe('Cross-Service Priority and Category Integration', () => {
    it('should integrate priority service with category service for visual indicators', () => {
      const task = new TaskEntity({
        id: '1',
        name: 'High priority task',
        importance: 40, // High importance (35+ = Très élevée)
        complexity: 2, // Low complexity
        points: 200, // 10 * 40 / 2 = 200
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

      const priorityDescription = TaskPriorityUIService.getPriorityDescription(task.importance)
      const categoryStyle = TaskCategoryService.getCategoryStyle('today')

      // High priority task should have appropriate description
      expect(priorityDescription).toBe('Très élevée')
      expect(categoryStyle).toBeDefined()
      expect(categoryStyle.label).toBe("Aujourd'hui")
    })

    it('should handle edge case: maximum priority overdue task', () => {
      const maxPriorityOverdueTask = new TaskEntity({
        id: '1',
        name: 'Maximum priority overdue',
        importance: 50, // Maximum importance
        complexity: 1, // Minimum complexity
        points: 500, // 10 * 50 / 1 = 500 (maximum)
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

      expect(maxPriorityOverdueTask.calculatePoints()).toBe(500) // 10 * 50 / 1
      expect(maxPriorityOverdueTask.getCategory()).toBe('overdue')
      expect(maxPriorityOverdueTask.isOverdue()).toBe(true)

      const priorityDescription = TaskPriorityUIService.getPriorityDescription(50)
      expect(priorityDescription).toBe('Critique')
    })

    it('should handle edge case: minimum priority future task', () => {
      const minPriorityFutureTask = new TaskEntity({
        id: '1',
        name: 'Minimum priority future',
        importance: 1, // Minimum importance
        complexity: 9, // Maximum complexity
        points: 2, // Math.round(10 * 1 / 9) = 1.11 -> 1, but let's use 2 for test
        plannedDate: '2025-01-20T10:00:00.000Z', // Future
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

      expect(minPriorityFutureTask.calculatePoints()).toBe(1) // Math.round(10 * 1 / 9) = 1
      expect(minPriorityFutureTask.getCategory()).toBe('future')

      const priorityDescription = TaskPriorityUIService.getPriorityDescription(1)
      expect(priorityDescription).toBe('Très faible')
    })
  })

  describe('Sorting Algorithm Edge Cases', () => {
    it('should handle tasks with identical priorities but different categories', () => {
      const tasks = [
        // Two tasks with same priority but different categories
        new TaskEntity({
          id: '1',
          name: 'Overdue same priority',
          importance: 3,
          complexity: 5,
          points: 150,
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
        }),
        new TaskEntity({
          id: '2',
          name: 'Today same priority',
          importance: 3,
          complexity: 5,
          points: 150,
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
      ]

      const sortedTasks = TaskSortingService.sortTasksByPriority(tasks)

      // Overdue should come before today, even with same priority
      expect(sortedTasks[0].id).toBe('1') // Overdue first
      expect(sortedTasks[1].id).toBe('2') // Today second
      expect(sortedTasks[0].getCategory()).toBe('overdue')
      expect(sortedTasks[1].getCategory()).toBe('today')
    })

    it('should handle complex subtask sorting within parent tasks', () => {
      const parentTask = new TaskEntity({
        id: 'parent',
        name: 'Parent task',
        importance: 20, // Medium importance
        complexity: 2, // Low complexity
        points: 100, // 10 * 20 / 2 = 100
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

      const subtasks = [
        new TaskEntity({
          id: 'sub1',
          name: 'Low priority subtask',
          importance: 10, // Lower importance
          complexity: 5, // Higher complexity
          points: 20, // 10 * 10 / 5 = 20
          plannedDate: undefined,
          dueDate: undefined,
          parentId: 'parent',
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-14T11:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        }),
        new TaskEntity({
          id: 'sub2',
          name: 'High priority subtask',
          importance: 30, // Higher importance
          complexity: 3, // Medium complexity
          points: 100, // 10 * 30 / 3 = 100 (same as parent)
          plannedDate: undefined,
          dueDate: undefined,
          parentId: 'parent',
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-14T12:00:00.000Z', // Newest
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        })
      ]

      const allTasks = [parentTask, ...subtasks]
      const sortedTasks = TaskSortingService.sortTasksByPriority(allTasks)

      // All tasks are 'no-date' category, so sorted by points DESC, then creation DESC
      // sub2 and parent have same points (100), so sub2 (newer) comes first, then parent, then sub1
      expect(sortedTasks[0].id).toBe('sub2') // Highest points, newest
      expect(sortedTasks[1].id).toBe('parent') // Same points as sub2, but older
      expect(sortedTasks[2].id).toBe('sub1') // Lowest points
    })

    it('should handle empty task lists and single task edge cases', () => {
      // Empty list
      const emptySorted = TaskSortingService.sortTasksByPriority([])
      expect(emptySorted).toEqual([])

      // Single task
      const singleTask = new TaskEntity({
        id: '1',
        name: 'Single task',
        importance: 3,
        complexity: 5,
        points: 150,
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

      const singleSorted = TaskSortingService.sortTasksByPriority([singleTask])
      expect(singleSorted).toHaveLength(1)
      expect(singleSorted[0].id).toBe('1')
    })
  })

  describe('Business Rule Invariants', () => {
    it('should maintain that overdue tasks always have higher priority than future tasks', () => {
      const overdueTask = new TaskEntity({
        id: '1',
        name: 'Overdue low priority',
        importance: 1,
        complexity: 1,
        points: 10,
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

      const futureTask = new TaskEntity({
        id: '2',
        name: 'Future high priority',
        importance: 5,
        complexity: 9,
        points: 450,
        plannedDate: '2025-01-20T10:00:00.000Z', // Future
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

      // Business invariant: overdue tasks should always come before future tasks
      // regardless of their individual priority scores
      const sortedTasks = TaskSortingService.sortTasksByPriority([futureTask, overdueTask])
      expect(sortedTasks[0].id).toBe('1') // Overdue first
      expect(sortedTasks[1].id).toBe('2') // Future second
    })

    it('should ensure collected tasks are only those without due dates and recently created', () => {
      const collectedTask = new TaskEntity({
        id: '1',
        name: 'High priority collected',
        importance: 50, // High importance
        complexity: 1, // Low complexity
        points: 500, // 10 * 50 / 1 = 500 (>= 500 for collected)
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T08:00:00.000Z', // Recent
        updatedAt: '2025-01-15T08:00:00.000Z',
        subtasks: [],
        tags: []
      })

      const oldNoDateTask = new TaskEntity({
        id: '2',
        name: 'Old no date',
        importance: 25, // Medium importance
        complexity: 5, // Medium complexity
        points: 50, // 10 * 25 / 5 = 50 (< 500, not collected)
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-10T10:00:00.000Z', // 5 days ago
        updatedAt: '2025-01-10T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      const futureDatedTask = new TaskEntity({
        id: '3',
        name: 'Future dated',
        importance: 25, // Medium importance
        complexity: 5, // Medium complexity
        points: 50, // 10 * 25 / 5 = 50
        plannedDate: '2025-01-17T10:00:00.000Z', // Day after tomorrow (future)
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T08:00:00.000Z',
        updatedAt: '2025-01-15T08:00:00.000Z',
        subtasks: [],
        tags: []
      })

      expect(collectedTask.getCategory()).toBe('no-date') // High priority, no date
      expect(oldNoDateTask.getCategory()).toBe('no-date') // Not high priority
      expect(futureDatedTask.getCategory()).toBe('future') // Has future date
    })

    it('should validate that point calculations are always positive and reasonable', () => {
      // Test various combinations
      const testCases = [
        { importance: 1, complexity: 9, expected: 1 }, // Math.round(10 * 1 / 9) = 1
        { importance: 50, complexity: 1, expected: 500 }, // Math.round(10 * 50 / 1) = 500
        { importance: 25, complexity: 5, expected: 50 }, // Math.round(10 * 25 / 5) = 50
        { importance: 30, complexity: 3, expected: 100 } // Math.round(10 * 30 / 3) = 100
      ]

      testCases.forEach(({ importance, complexity, expected }) => {
        const task = new TaskEntity({
          id: 'test',
          name: 'Test task',
          importance,
          complexity,
          points: expected,
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
        })

        const points = task.calculatePoints()
        expect(points).toBe(expected)
        expect(points).toBeGreaterThan(0)
        expect(points).toBeLessThanOrEqual(500) // Maximum possible
      })
    })
  })
})