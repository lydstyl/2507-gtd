import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskEntity } from '../entities/Task'
import { TaskPriorityService } from '@gtd/shared'

// Mock timer for consistent date testing
const mockDate = new Date('2025-01-15T10:00:00Z') // Wednesday
vi.useFakeTimers()
vi.setSystemTime(mockDate)

describe('Advanced Edge Cases', () => {
  let dateContext: ReturnType<typeof TaskPriorityService.createDateContext>

  beforeEach(() => {
    dateContext = TaskPriorityService.createDateContext()
  })

  describe('Task Categorization Edge Cases', () => {
    it('should handle tasks with due dates that are also urgent', () => {
      // Task with both planned date and urgent due date
      const taskWithBothDates = new TaskEntity({
        id: '1',
        name: 'Task with both dates',
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

      // Should be categorized as 'today' because due date is urgent and today
      expect(taskWithBothDates.getCategory()).toBe('today')
      expect(taskWithBothDates.isDueToday()).toBe(true)
    })

    it('should handle tasks with only due dates (no planned dates)', () => {
      // Task with only a due date, no planned date
      const taskWithOnlyDueDate = new TaskEntity({
        id: '1',
        name: 'Task with only due date',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: undefined,
        dueDate: '2025-01-16T10:00:00.000Z', // Tomorrow
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should be categorized as 'tomorrow' because due date is used as effective date when urgent
      expect(taskWithOnlyDueDate.getCategory()).toBe('tomorrow')
      expect(taskWithOnlyDueDate.isDueToday()).toBe(false)
      expect(taskWithOnlyDueDate.isOverdue()).toBe(false)
    })

    it('should handle collected tasks with zero importance', () => {
      // New default task: importance=0, complexity=3
      const newDefaultTask = new TaskEntity({
        id: '1',
        name: 'New default task',
        importance: 0,
        complexity: 3,
        points: 0,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      expect(newDefaultTask.getCategory()).toBe('collected')
      expect(newDefaultTask.calculatePoints()).toBe(0)
    })

    it('should handle boundary case: exactly 500 points for collected status', () => {
      // Task with exactly 500 points
      const exactly500Points = new TaskEntity({
        id: '1',
        name: 'Exactly 500 points',
        importance: 50,
        complexity: 1,
        points: 500,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      expect(exactly500Points.getCategory()).toBe('no-date')
      expect(exactly500Points.calculatePoints()).toBe(500)
    })

    it('should handle tasks that become collected after date changes', () => {
      // Start with a future task
      const futureTask = new TaskEntity({
        id: '1',
        name: 'Future task',
        importance: 50,
        complexity: 1,
        points: 500,
        plannedDate: '2025-01-20T10:00:00.000Z',
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      expect(futureTask.getCategory()).toBe('future')

      // Remove the date - should become collected
      const collectedTask = new TaskEntity({
        ...futureTask.rawTask,
        plannedDate: undefined
      })

      expect(collectedTask.getCategory()).toBe('no-date')
    })
  })

  describe('Prioritization Edge Cases', () => {
    it('should handle tasks with identical points but different creation times', () => {
      const tasks = [
        // Two tasks with identical points but different creation times
        new TaskEntity({
          id: 'older',
          name: 'Older task',
          importance: 25,
          complexity: 5,
          points: 50,
          plannedDate: undefined,
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-10T10:00:00.000Z', // Older
          updatedAt: '2025-01-10T10:00:00.000Z',
          subtasks: [],
          tags: []
        }),
        new TaskEntity({
          id: 'newer',
          name: 'Newer task',
          importance: 25,
          complexity: 5,
          points: 50,
          plannedDate: undefined,
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-14T10:00:00.000Z', // Newer
          updatedAt: '2025-01-14T10:00:00.000Z',
          subtasks: [],
          tags: []
        })
      ]

      // Both in 'no-date' category, same points, should sort by creation DESC (newer first)
      const comparison1 = TaskPriorityService.compareTasksPriority(tasks[0].rawTask, tasks[1].rawTask, dateContext)
      expect(comparison1).toBeGreaterThan(0) // older > newer means older comes after newer

      const comparison2 = TaskPriorityService.compareTasksPriority(tasks[1].rawTask, tasks[0].rawTask, dateContext)
      expect(comparison2).toBeLessThan(0) // newer < older means newer comes before older
    })

    it('should handle overdue tasks with different overdue durations', () => {
      const tasks = [
        // Very overdue task
        new TaskEntity({
          id: 'very-overdue',
          name: 'Very overdue',
          importance: 25,
          complexity: 5,
          points: 50,
          plannedDate: '2025-01-01T10:00:00.000Z', // 14 days ago
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2024-12-30T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        }),
        // Recently overdue task
        new TaskEntity({
          id: 'recently-overdue',
          name: 'Recently overdue',
          importance: 25,
          complexity: 5,
          points: 50,
          plannedDate: '2025-01-14T10:00:00.000Z', // Yesterday
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-13T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        })
      ]

      // Both overdue, same points, should sort by date ASC (oldest first)
      const comparison = TaskPriorityService.compareTasksPriority(tasks[0].rawTask, tasks[1].rawTask, dateContext)
      expect(comparison).toBeLessThan(0) // very-overdue < recently-overdue means very-overdue comes first
    })

    it('should handle future tasks with different future dates', () => {
      const tasks = [
        // Soon future task
        new TaskEntity({
          id: 'soon-future',
          name: 'Soon future',
          importance: 25,
          complexity: 5,
          points: 50,
          plannedDate: '2025-01-17T10:00:00.000Z', // Day after tomorrow
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
        // Far future task
        new TaskEntity({
          id: 'far-future',
          name: 'Far future',
          importance: 25,
          complexity: 5,
          points: 50,
          plannedDate: '2025-02-15T10:00:00.000Z', // Far future
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

      // Both future, same points, should sort by date ASC (soonest first)
      const comparison = TaskPriorityService.compareTasksPriority(tasks[0].rawTask, tasks[1].rawTask, dateContext)
      expect(comparison).toBeLessThan(0) // soon-future < far-future means soon-future comes first
    })

    it('should handle category transitions with same priority scores', () => {
      // Create tasks that would be in different categories but same priority
      const overdueTask = new TaskEntity({
        id: 'overdue',
        name: 'Overdue task',
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

      const todayTask = new TaskEntity({
        id: 'today',
        name: 'Today task',
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

      // Overdue should always come before today, regardless of other factors
      const comparison = TaskPriorityService.compareTasksPriority(overdueTask.rawTask, todayTask.rawTask, dateContext)
      expect(comparison).toBeLessThan(0) // overdue < today means overdue comes first
    })
  })

  describe('Advanced Sorting Algorithm Edge Cases', () => {
    it('should handle sorting with mixed completed and incomplete tasks', () => {
      const tasks = [
        new TaskEntity({
          id: 'completed-high',
          name: 'Completed high priority',
          importance: 40,
          complexity: 2,
          points: 200,
          plannedDate: undefined,
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: true,
          completedAt: '2025-01-14T10:00:00.000Z',
          createdAt: '2025-01-10T10:00:00.000Z',
          updatedAt: '2025-01-14T10:00:00.000Z',
          subtasks: [],
          tags: []
        }),
        new TaskEntity({
          id: 'incomplete-low',
          name: 'Incomplete low priority',
          importance: 10,
          complexity: 5,
          points: 20,
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
      ]

      const sortedTasks = TaskPriorityService.compareTasksPriority(tasks[0].rawTask, tasks[1].rawTask, dateContext)
      // Both are 'no-date' category, so sorted by points DESC
      expect(sortedTasks).toBeLessThan(0) // completed-high (200 points) < incomplete-low (20 points) means completed-high comes first
    })

    it('should handle sorting tasks with extreme date ranges', () => {
      const farFutureTask = new TaskEntity({
        id: 'far-future',
        name: 'Far future task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: '2026-12-31T10:00:00.000Z', // Very far future
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

      const nearFutureTask = new TaskEntity({
        id: 'near-future',
        name: 'Near future task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: '2025-01-17T10:00:00.000Z', // Day after tomorrow
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

      const comparison = TaskPriorityService.compareTasksPriority(nearFutureTask.rawTask, farFutureTask.rawTask, dateContext)
      // Both are 'future' category, so sorted by date ASC
      expect(comparison).toBeLessThan(0) // near-future < far-future means near-future comes first
    })

    it('should handle sorting with tasks having same date but different points', () => {
      const lowPointsTask = new TaskEntity({
        id: 'same-date-low-points',
        name: 'Same date low points',
        importance: 10,
        complexity: 5,
        points: 20,
        plannedDate: '2025-01-20T10:00:00.000Z', // Same date
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T12:00:00.000Z', // Later creation
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      const highPointsTask = new TaskEntity({
        id: 'same-date-high-points',
        name: 'Same date high points',
        importance: 30,
        complexity: 3,
        points: 100,
        plannedDate: '2025-01-20T10:00:00.000Z', // Same date
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z', // Earlier creation
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      const comparison = TaskPriorityService.compareTasksPriority(highPointsTask.rawTask, lowPointsTask.rawTask, dateContext)
      // Both are 'future' category with same date, so sorted by points DESC
      expect(comparison).toBeLessThan(0) // high-points < low-points means high-points comes first
    })

    it('should handle sorting with tasks having same points and same date', () => {
      const newerTask = new TaskEntity({
        id: 'same-all-newer',
        name: 'Same all newer',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: '2025-01-20T10:00:00.000Z', // Same date
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T12:00:00.000Z', // Newer
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      const olderTask = new TaskEntity({
        id: 'same-all-older',
        name: 'Same all older',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: '2025-01-20T10:00:00.000Z', // Same date
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-14T10:00:00.000Z', // Older
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      const comparison = TaskPriorityService.compareTasksPriority(newerTask.rawTask, olderTask.rawTask, dateContext)
      // Both are 'future' category with same date and points, so sorted by creation DESC
      expect(comparison).toBeLessThan(0) // newer < older means newer comes first
    })

    it('should handle empty and single item sorting edge cases', () => {
      // Empty array should be handled gracefully
      expect(() => {
        TaskPriorityService.compareTasksPriority({} as any, {} as any, dateContext)
        // This should not crash, though result is undefined
      }).not.toThrow()

      // Single task comparison with itself should be 0
      const task = {
        id: 'test',
        name: 'Test',
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
      }

      const selfComparison = TaskPriorityService.compareTasksPriority(task, task, dateContext)
      expect(selfComparison).toBe(0) // Same task should compare equal
    })

    it('should handle boundary values in sorting comparisons', () => {
      const minPointsTask = {
        id: 'min',
        name: 'Min points',
        importance: 1,
        complexity: 9,
        points: 1,
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

      const maxPointsTask = {
        id: 'max',
        name: 'Max points',
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
      }

      const comparison = TaskPriorityService.compareTasksPriority(maxPointsTask, minPointsTask, dateContext)
      // Both 'no-date' category, max points should come first
      expect(comparison).toBeLessThan(0)
    })
  })

  describe('Date Handling Edge Cases', () => {
    it('should handle invalid date strings gracefully', () => {
      const taskWithInvalidDate = new TaskEntity({
        id: '1',
        name: 'Invalid date task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: 'invalid-date-string',
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should not crash and should categorize as no-date
      expect(taskWithInvalidDate.getCategory()).toBe('no-date')
      expect(taskWithInvalidDate.isOverdue()).toBe(false)
      expect(taskWithInvalidDate.isDueToday()).toBe(false)
    })

    it('should handle timezone edge cases', () => {
      // Task due at midnight UTC (which might be different local time)
      const midnightUTCTask = new TaskEntity({
        id: '1',
        name: 'Midnight UTC task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: '2025-01-16T00:00:00.000Z', // Midnight UTC tomorrow
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should be categorized as tomorrow regardless of local timezone
      expect(midnightUTCTask.getCategory()).toBe('tomorrow')
    })

    it('should handle leap year dates correctly', () => {
      // Test with a future leap year date
      const leapYearTask = new TaskEntity({
        id: '1',
        name: 'Leap year task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: '2028-02-29T10:00:00.000Z', // Future leap year date
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should handle leap year dates without issues
      expect(() => leapYearTask.getCategory()).not.toThrow()
      expect(leapYearTask.getCategory()).toBe('future')
    })
  })

  describe('Subtask Relationship Edge Cases', () => {
    it('should handle orphaned subtasks (parent does not exist)', () => {
      const orphanedSubtask = new TaskEntity({
        id: 'orphan',
        name: 'Orphaned subtask',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: 'non-existent-parent',
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should still be categorized normally despite having non-existent parent
      expect(orphanedSubtask.getCategory()).toBe('no-date')
      expect(orphanedSubtask.isSubtask()).toBe(true)
      expect(orphanedSubtask.hasSubtasks()).toBe(false)
    })

    it('should handle circular parent relationships', () => {
      // This would be prevented by the database, but test the logic handles it
      const selfReferencingTask = new TaskEntity({
        id: 'self-ref',
        name: 'Self referencing task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: 'self-ref', // Points to itself
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should still function normally
      expect(selfReferencingTask.isSubtask()).toBe(true)
      expect(selfReferencingTask.getCategory()).toBe('no-date')
    })

    it('should handle tasks with both parentId and subtasks', () => {
      // A task that is both a subtask and has its own subtasks
      const complexHierarchyTask = new TaskEntity({
        id: 'complex',
        name: 'Complex hierarchy task',
        importance: 25,
        complexity: 5,
        points: 50,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: 'parent-id',
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-15T09:00:00.000Z',
        updatedAt: '2025-01-15T09:00:00.000Z',
        subtasks: [
          {
            id: 'child1',
            name: 'Child 1',
            importance: 20,
            complexity: 3,
            points: 67,
            plannedDate: undefined,
            dueDate: undefined,
            parentId: 'complex',
            userId: 'user1',
            isCompleted: false,
            completedAt: undefined,
            createdAt: '2025-01-15T10:00:00.000Z',
            updatedAt: '2025-01-15T10:00:00.000Z',
            subtasks: [],
            tags: []
          }
        ],
        tags: []
      })

      expect(complexHierarchyTask.isSubtask()).toBe(true)
      expect(complexHierarchyTask.hasSubtasks()).toBe(true)
      expect(complexHierarchyTask.getSubtaskEntities()).toHaveLength(1)
    })
  })

  describe('Business Rule Invariants Under Stress', () => {
    it('should maintain category ordering invariant with many tasks', () => {
      // Create many tasks across all categories
      const tasks = [
        // Overdue tasks with varying priorities
        ...[1, 2, 3].map(i => new TaskEntity({
          id: `overdue-${i}`,
          name: `Overdue ${i}`,
          importance: 40 - i * 10, // 40, 30, 20
          complexity: 2,
          points: Math.round(10 * (40 - i * 10) / 2),
          plannedDate: '2025-01-14T10:00:00.000Z',
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-10T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        })),
        // Today tasks
        ...[1, 2, 3].map(i => new TaskEntity({
          id: `today-${i}`,
          name: `Today ${i}`,
          importance: 40 - i * 10,
          complexity: 2,
          points: Math.round(10 * (40 - i * 10) / 2),
          plannedDate: '2025-01-15T15:00:00.000Z',
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-14T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        })),
        // Future tasks
        ...[1, 2, 3].map(i => new TaskEntity({
          id: `future-${i}`,
          name: `Future ${i}`,
          importance: 40 - i * 10,
          complexity: 2,
          points: Math.round(10 * (40 - i * 10) / 2),
          plannedDate: `2025-01-${17 + i}T10:00:00.000Z`, // 17, 18, 19
          dueDate: undefined,
          parentId: undefined,
          userId: 'user1',
          isCompleted: false,
          completedAt: undefined,
          createdAt: '2025-01-14T10:00:00.000Z',
          updatedAt: '2025-01-15T10:00:00.000Z',
          subtasks: [],
          tags: []
        }))
      ]

      // Verify that all overdue tasks come before all today tasks,
      // and all today tasks come before all future tasks
      const overdueTasks = tasks.filter(t => t.getCategory() === 'overdue')
      const todayTasks = tasks.filter(t => t.getCategory() === 'today')
      const futureTasks = tasks.filter(t => t.getCategory() === 'future')

      expect(overdueTasks).toHaveLength(3)
      expect(todayTasks).toHaveLength(3)
      expect(futureTasks).toHaveLength(3)

      // Get the highest priority task from each category
      const highestOverdue = overdueTasks[0] // Should be overdue-1 (importance 40)
      const highestToday = todayTasks[0] // Should be today-1 (importance 40)
      const highestFuture = futureTasks[0] // Should be future-1 (importance 40)

      // Even with same priority scores, overdue should come before today,
      // and today should come before future
      const overdueVsToday = TaskPriorityService.compareTasksPriority(
        highestOverdue.rawTask, highestToday.rawTask, dateContext
      )
      expect(overdueVsToday).toBeLessThan(0) // overdue < today

      const todayVsFuture = TaskPriorityService.compareTasksPriority(
        highestToday.rawTask, highestFuture.rawTask, dateContext
      )
      expect(todayVsFuture).toBeLessThan(0) // today < future
    })

    it('should handle extreme values without breaking', () => {
      // Test with extreme but valid values
      const extremeTask = new TaskEntity({
        id: 'extreme',
        name: 'Extreme task',
        importance: 50, // Maximum
        complexity: 1, // Minimum
        points: 500, // Maximum
        plannedDate: '2025-01-14T10:00:00.000Z', // Overdue
        dueDate: undefined,
        parentId: undefined,
        userId: 'user1',
        isCompleted: false,
        completedAt: undefined,
        createdAt: '2025-01-01T00:00:00.000Z', // Very old
        updatedAt: '2025-01-15T10:00:00.000Z',
        subtasks: [],
        tags: []
      })

      // Should handle extreme values without issues
      expect(extremeTask.calculatePoints()).toBe(500)
      expect(extremeTask.getCategory()).toBe('overdue')
      expect(() => extremeTask.isOverdue()).not.toThrow()
      expect(() => extremeTask.isDueToday()).not.toThrow()
    })
  })
})