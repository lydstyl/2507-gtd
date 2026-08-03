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
        status: 'collecte',
        importance: 450, // High importance
        complexity: 1, // Low complexity
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

      expect(collectedTask.getCategory()).toBe('collected')
      expect(collectedTask.importance).toBe(450) // max importance in new scale

      // Add due date for today - should become pret-today task
      const todayTask = new TaskEntity({
        ...collectedTask.rawTask,
        status: 'pret',
        plannedDate: '2025-01-15T15:00:00.000Z', // Today
        updatedAt: '2025-01-15T10:30:00.000Z'
      })

      expect(todayTask.getCategory()).toBe('pret-today')
      expect(todayTask.isDueToday()).toBe(true)
      expect(todayTask.isOverdue()).toBe(false)

      // Make it overdue
      const overdueTask = new TaskEntity({
        ...todayTask.rawTask,
        status: 'pret',
        plannedDate: '2025-01-14T15:00:00.000Z', // Yesterday
        updatedAt: '2025-01-15T10:30:00.000Z'
      })

      expect(overdueTask.getCategory()).toBe('pret-overdue')
      expect(overdueTask.isOverdue()).toBe(true)
    })

    it('should maintain priority ordering across category transitions', () => {
      const tasks = [
        // High priority overdue task
        new TaskEntity({
          id: '1',
          name: 'Urgent overdue task',
          status: 'pret',
          importance: 450, // High importance
          complexity: 1, // Low complexity
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
          status: 'pret',
          importance: 250, // Medium importance
          complexity: 2, // Medium complexity
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
          status: 'pret',
          importance: 100, // Low importance
          complexity: 5, // Medium complexity
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

      // Should be sorted: pret-overdue (high priority) -> pret-today (medium) -> pret-future (low)
      expect(sortedTasks[0].id).toBe('1') // Overdue high priority
      expect(sortedTasks[1].id).toBe('2') // Today medium priority
      expect(sortedTasks[2].id).toBe('3') // Future low priority

      // Verify categories are maintained
      expect(sortedTasks[0].getCategory()).toBe('pret-overdue')
      expect(sortedTasks[1].getCategory()).toBe('pret-today')
      expect(sortedTasks[2].getCategory()).toBe('pret-future')
    })
  })

  describe('Cross-Service Priority and Category Integration', () => {
    it('should integrate priority service with category service for visual indicators', () => {
      const task = new TaskEntity({
        id: '1',
        name: 'High priority task',
        status: 'pret',
        importance: 400, // High importance (35+ = Très élevée)
        complexity: 2, // Low complexity
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
      const categoryStyle = TaskCategoryService.getCategoryStyle('pret-today')

      // High priority task should have appropriate description
      expect(priorityDescription).toBe('Importante + Urgente 🔥')
      expect(categoryStyle).toBeDefined()
      expect(categoryStyle.label).toBe("Aujourd'hui")
    })

    it('should handle edge case: maximum priority overdue task', () => {
      const maxPriorityOverdueTask = new TaskEntity({
        id: '1',
        name: 'Maximum priority overdue',
        status: 'pret',
        importance: 450, // Maximum importance
        complexity: 1, // Minimum complexity
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

      expect(maxPriorityOverdueTask.importance).toBe(450)
      expect(maxPriorityOverdueTask.getCategory()).toBe('pret-overdue')
      expect(maxPriorityOverdueTask.isOverdue()).toBe(true)

      const priorityDescription = TaskPriorityUIService.getPriorityDescription(450)
      expect(priorityDescription).toBe('Importante + Urgente 🔥')
    })

    it('should handle edge case: minimum priority future task', () => {
      const minPriorityFutureTask = new TaskEntity({
        id: '1',
        name: 'Minimum priority future',
        status: 'pret',
        importance: 100, // Minimum importance
        complexity: 9, // Maximum complexity
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

      expect(minPriorityFutureTask.importance).toBe(100)
      expect(minPriorityFutureTask.getCategory()).toBe('pret-future')

      const priorityDescription = TaskPriorityUIService.getPriorityDescription(100)
      expect(priorityDescription).toBe('Basique 🐢')
    })
  })

  describe('Sorting Algorithm Edge Cases', () => {
    it('should handle tasks with identical priorities but different categories', () => {
      const tasks = [
        // Two tasks with same priority but different categories
        new TaskEntity({
          id: '1',
          name: 'Overdue same priority',
          status: 'pret',
          importance: 100,
          complexity: 5,
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
          status: 'pret',
          importance: 100,
          complexity: 5,
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

      // Pret-overdue should come before pret-today, even with same priority
      expect(sortedTasks[0].id).toBe('1') // Overdue first
      expect(sortedTasks[1].id).toBe('2') // Today second
      expect(sortedTasks[0].getCategory()).toBe('pret-overdue')
      expect(sortedTasks[1].getCategory()).toBe('pret-today')
    })

    it('should handle complex subtask sorting within parent tasks', () => {
      const parentTask = new TaskEntity({
        id: 'parent',
        name: 'Parent task',
        importance: 200, // Medium importance
        complexity: 2, // Low complexity
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
          importance: 100, // Lower importance
          complexity: 5, // Higher complexity
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
          importance: 300, // Higher importance
          complexity: 3, // Medium complexity
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

      // All tasks are 'pret-no-date' category, so sorted by importance DESC, then creation DESC
      // sub2 (importance 300) comes first, then parent (200), then sub1 (100)
      expect(sortedTasks[0].id).toBe('sub2') // Highest importance, newest
      expect(sortedTasks[1].id).toBe('parent') // Medium importance
      expect(sortedTasks[2].id).toBe('sub1') // Lowest importance
    })

    it('should handle empty task lists and single task edge cases', () => {
      // Empty list
      const emptySorted = TaskSortingService.sortTasksByPriority([])
      expect(emptySorted).toEqual([])

      // Single task
      const singleTask = new TaskEntity({
        id: '1',
        name: 'Single task',
        importance: 100,
        complexity: 5,
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
        importance: 100,
        complexity: 1,
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
        importance: 100,
        complexity: 9,
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

    it('should ensure collected tasks have status collecte', () => {
      const collectedTask = new TaskEntity({
        id: '1',
        name: 'High priority collected',
        status: 'collecte',
        importance: 450, // High importance
        complexity: 1, // Low complexity
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
        importance: 250, // Medium importance
        complexity: 5, // Medium complexity
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
        importance: 250, // Medium importance
        complexity: 5, // Medium complexity
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

      expect(collectedTask.getCategory()).toBe('collected') // Status collecte
      expect(oldNoDateTask.getCategory()).toBe('pret-no-date') // No date, fallback pret
      expect(futureDatedTask.getCategory()).toBe('pret-future') // Has future date, fallback pret
    })

    it('should validate that importance values are always within valid bounds', () => {
      // Test various combinations
      const testCases = [
        { importance: 100, complexity: 9 }, // Minimum importance
        { importance: 450, complexity: 1 }, // Maximum importance
        { importance: 250, complexity: 5 }, // Medium importance
        { importance: 300, complexity: 3 } // High importance
      ]

      testCases.forEach(({ importance, complexity }) => {
        const task = new TaskEntity({
          id: 'test',
          name: 'Test task',
          importance,
          complexity,
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

        expect(task.importance).toBe(importance)
        expect(task.importance).toBeGreaterThanOrEqual(100)
        expect(task.importance).toBeLessThanOrEqual(499) // Maximum possible
      })
    })
  })
})