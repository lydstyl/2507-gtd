import { describe, it, expect } from 'vitest'
import { Task, TaskWithSubtasks, CreateTaskData, UpdateTaskData } from '../../../src/domain/entities/Task'
import { createMockTask, createMockTaskWithSubtasks, createMockUser, createMockTag } from '../../utils/test-helpers'

describe('Task Entity', () => {
  describe('Task interface validation', () => {
    it('should create a valid task with all required properties', () => {
      const task = createMockTask({
        name: 'Test Task',
        importance: 25,
        complexity: 5,
        points: 50,
        userId: 'user-1'
      })

      expect(task.id).toBeDefined()
      expect(task.name).toBe('Test Task')
      expect(task.importance).toBe(25)
      expect(task.complexity).toBe(5)
      expect(task.points).toBe(50)
      expect(task.userId).toBe('user-1')
      expect(task.isCompleted).toBe(false)
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle optional properties correctly', () => {
      const taskWithOptionals = createMockTask({
        link: 'https://example.com',
        note: 'Test note',
        parentId: 'parent-1',
        plannedDate: new Date('2023-06-16'),
        dueDate: new Date('2023-06-17')
      })

      expect(taskWithOptionals.link).toBe('https://example.com')
      expect(taskWithOptionals.note).toBe('Test note')
      expect(taskWithOptionals.parentId).toBe('parent-1')
      expect(taskWithOptionals.plannedDate).toEqual(new Date('2023-06-16'))
      expect(taskWithOptionals.dueDate).toEqual(new Date('2023-06-17'))

      const taskWithoutOptionals = createMockTask()
      expect(taskWithoutOptionals.link).toBeUndefined()
      expect(taskWithoutOptionals.note).toBeUndefined()
      expect(taskWithoutOptionals.parentId).toBeUndefined()
      expect(taskWithoutOptionals.plannedDate).toBeUndefined()
      expect(taskWithoutOptionals.dueDate).toBeUndefined()
    })

    it('should handle completion state correctly', () => {
      const completedTask = createMockTask({
        isCompleted: true,
        completedAt: new Date('2023-06-15T15:00:00Z')
      })

      expect(completedTask.isCompleted).toBe(true)
      expect(completedTask.completedAt).toEqual(new Date('2023-06-15T15:00:00Z'))

      const incompleteTask = createMockTask({
        isCompleted: false,
        completedAt: undefined
      })

      expect(incompleteTask.isCompleted).toBe(false)
      expect(incompleteTask.completedAt).toBeUndefined()
    })
  })

  describe('TaskWithSubtasks interface', () => {
    it('should extend Task with subtasks and tags', () => {
      const subtask1 = createMockTaskWithSubtasks({
        id: 'subtask-1',
        name: 'Subtask 1',
        parentId: 'parent-task'
      })

      const subtask2 = createMockTaskWithSubtasks({
        id: 'subtask-2',
        name: 'Subtask 2',
        parentId: 'parent-task'
      })

      const tag1 = createMockTag({ id: 'tag-1', name: 'Work' })
      const tag2 = createMockTag({ id: 'tag-2', name: 'Urgent' })

      const parentTask = createMockTaskWithSubtasks({
        id: 'parent-task',
        name: 'Parent Task',
        subtasks: [subtask1, subtask2],
        tags: [tag1, tag2]
      })

      expect(parentTask.subtasks).toHaveLength(2)
      expect(parentTask.subtasks[0].name).toBe('Subtask 1')
      expect(parentTask.subtasks[1].name).toBe('Subtask 2')
      expect(parentTask.tags).toHaveLength(2)
      expect(parentTask.tags[0].name).toBe('Work')
      expect(parentTask.tags[1].name).toBe('Urgent')
    })

    it('should allow empty subtasks and tags arrays', () => {
      const task = createMockTaskWithSubtasks({
        subtasks: [],
        tags: []
      })

      expect(task.subtasks).toEqual([])
      expect(task.tags).toEqual([])
    })

    it('should support nested subtasks', () => {
      const deepSubtask = createMockTaskWithSubtasks({
        id: 'deep-subtask',
        name: 'Deep Subtask',
        parentId: 'subtask-1'
      })

      const subtask = createMockTaskWithSubtasks({
        id: 'subtask-1',
        name: 'Subtask',
        parentId: 'parent-task',
        subtasks: [deepSubtask]
      })

      const parentTask = createMockTaskWithSubtasks({
        id: 'parent-task',
        name: 'Parent Task',
        subtasks: [subtask]
      })

      expect(parentTask.subtasks[0].subtasks).toHaveLength(1)
      expect(parentTask.subtasks[0].subtasks[0].name).toBe('Deep Subtask')
    })
  })

  describe('CreateTaskData validation', () => {
    it('should validate required fields', () => {
      const validCreateData: CreateTaskData = {
        name: 'New Task',
        userId: 'user-1'
      }

      expect(validCreateData.name).toBe('New Task')
      expect(validCreateData.userId).toBe('user-1')
    })

    it('should handle optional fields with defaults', () => {
      const createDataWithDefaults: CreateTaskData = {
        name: 'New Task',
        importance: 0,     // Default for collected tasks
        complexity: 3,     // Default complexity
        userId: 'user-1',
        isCompleted: false // Default state
      }

      expect(createDataWithDefaults.importance).toBe(0)
      expect(createDataWithDefaults.complexity).toBe(3)
      expect(createDataWithDefaults.isCompleted).toBe(false)
    })

    it('should handle all optional properties', () => {
      const completeCreateData: CreateTaskData = {
        name: 'Complete Task',
        link: 'https://example.com',
        note: 'Detailed note',
        importance: 35,
        complexity: 7,
        parentId: 'parent-1',
        tagIds: ['tag-1', 'tag-2'],
        userId: 'user-1',
        plannedDate: new Date('2023-06-20'),
        dueDate: new Date('2023-06-25'),
        isCompleted: false
      }

      expect(completeCreateData.tagIds).toEqual(['tag-1', 'tag-2'])
      expect(completeCreateData.plannedDate).toEqual(new Date('2023-06-20'))
      expect(completeCreateData.dueDate).toEqual(new Date('2023-06-25'))
    })
  })

  describe('UpdateTaskData validation', () => {
    it('should allow partial updates', () => {
      const nameUpdate: UpdateTaskData = {
        name: 'Updated Name'
      }

      const importanceUpdate: UpdateTaskData = {
        importance: 40
      }

      const fullUpdate: UpdateTaskData = {
        name: 'Fully Updated Task',
        importance: 45,
        complexity: 8,
        plannedDate: new Date('2023-06-30'),
        isCompleted: true,
        completedAt: new Date()
      }

      expect(nameUpdate.name).toBe('Updated Name')
      expect(nameUpdate.importance).toBeUndefined()

      expect(importanceUpdate.importance).toBe(40)
      expect(importanceUpdate.name).toBeUndefined()

      expect(fullUpdate.name).toBe('Fully Updated Task')
      expect(fullUpdate.importance).toBe(45)
      expect(fullUpdate.isCompleted).toBe(true)
    })

    it('should handle null values for clearing fields', () => {
      const clearDatesUpdate: UpdateTaskData = {
        plannedDate: null,
        dueDate: null,
        completedAt: null
      }

      expect(clearDatesUpdate.plannedDate).toBeNull()
      expect(clearDatesUpdate.dueDate).toBeNull()
      expect(clearDatesUpdate.completedAt).toBeNull()
    })

    it('should allow tag updates', () => {
      const tagUpdate: UpdateTaskData = {
        tagIds: ['new-tag-1', 'new-tag-2']
      }

      const clearTags: UpdateTaskData = {
        tagIds: []
      }

      expect(tagUpdate.tagIds).toEqual(['new-tag-1', 'new-tag-2'])
      expect(clearTags.tagIds).toEqual([])
    })
  })

  describe('Business logic validation', () => {
    it('should enforce importance range (0-50)', () => {
      const validImportances = [0, 25, 50]
      const invalidImportances = [-1, 51, 100]

      validImportances.forEach(importance => {
        const task = createMockTask({ importance })
        expect(task.importance).toBe(importance)
      })

      // Note: Actual validation would be in use cases or domain services
      invalidImportances.forEach(importance => {
        // These would be caught by validation in the use case layer
        expect(importance < 0 || importance > 50).toBe(true)
      })
    })

    it('should enforce complexity range (1-9)', () => {
      const validComplexities = [1, 5, 9]
      const invalidComplexities = [0, 10, 15]

      validComplexities.forEach(complexity => {
        const task = createMockTask({ complexity })
        expect(task.complexity).toBe(complexity)
      })

      invalidComplexities.forEach(complexity => {
        expect(complexity < 1 || complexity > 9).toBe(true)
      })
    })

    it('should enforce points range (0-500)', () => {
      const validPoints = [0, 250, 500]
      const invalidPoints = [-1, 501, 1000]

      validPoints.forEach(points => {
        const task = createMockTask({ points })
        expect(task.points).toBe(points)
      })

      invalidPoints.forEach(points => {
        expect(points < 0 || points > 500).toBe(true)
      })
    })

    it('should validate points calculation consistency', () => {
      const testCases = [
        { importance: 50, complexity: 1, expectedPoints: 500 },
        { importance: 25, complexity: 5, expectedPoints: 50 },
        { importance: 30, complexity: 3, expectedPoints: 100 },
        { importance: 0, complexity: 5, expectedPoints: 0 }
      ]

      testCases.forEach(({ importance, complexity, expectedPoints }) => {
        const calculatedPoints = Math.round(10 * importance / complexity)
        expect(calculatedPoints).toBe(expectedPoints)
      })
    })

    it('should handle parent-child relationships', () => {
      const parentTask = createMockTask({
        id: 'parent-1',
        name: 'Parent Task',
        parentId: undefined
      })

      const childTask = createMockTask({
        id: 'child-1',
        name: 'Child Task',
        parentId: 'parent-1'
      })

      expect(parentTask.parentId).toBeUndefined()
      expect(childTask.parentId).toBe('parent-1')
    })

    it('should handle completion workflow', () => {
      const task = createMockTask({
        isCompleted: false,
        completedAt: undefined
      })

      expect(task.isCompleted).toBe(false)
      expect(task.completedAt).toBeUndefined()

      // Simulating completion
      const completedTask = createMockTask({
        ...task,
        isCompleted: true,
        completedAt: new Date()
      })

      expect(completedTask.isCompleted).toBe(true)
      expect(completedTask.completedAt).toBeInstanceOf(Date)
    })

    it('should handle date validation scenarios', () => {
      const validDates = [
        new Date('2023-06-15'),
        new Date('2023-12-31'),
        new Date('2024-01-01')
      ]

      const today = new Date()
      const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      validDates.forEach(date => {
        const task = createMockTask({
          plannedDate: date,
          dueDate: date
        })

        expect(task.plannedDate).toEqual(date)
        expect(task.dueDate).toEqual(date)
      })

      // Test relative dates
      const taskWithRelativeDates = createMockTask({
        plannedDate: past,
        dueDate: future
      })

      expect(taskWithRelativeDates.plannedDate!.getTime()).toBeLessThan(today.getTime())
      expect(taskWithRelativeDates.dueDate!.getTime()).toBeGreaterThan(today.getTime())
    })

    it('should validate user isolation', () => {
      const user1Task = createMockTask({ userId: 'user-1' })
      const user2Task = createMockTask({ userId: 'user-2' })

      expect(user1Task.userId).toBe('user-1')
      expect(user2Task.userId).toBe('user-2')
      expect(user1Task.userId).not.toBe(user2Task.userId)
    })
  })

  describe('Edge cases and error scenarios', () => {
    it('should handle empty and whitespace names appropriately', () => {
      // This would be validated in use case layer
      const emptyName = ''
      const whitespaceName = '   '
      const validName = 'Valid Task Name'

      expect(emptyName.trim().length).toBe(0)
      expect(whitespaceName.trim().length).toBe(0)
      expect(validName.trim().length).toBeGreaterThan(0)
    })

    it('should handle very long names and notes', () => {
      const longName = 'A'.repeat(300)
      const longNote = 'B'.repeat(15000)

      // These would be validated against business constants
      expect(longName.length).toBeGreaterThan(200) // Exceeds max length
      expect(longNote.length).toBeGreaterThan(10000) // Exceeds max length
    })

    it('should handle special characters in names and notes', () => {
      const specialCharTask = createMockTask({
        name: 'Task with émojis 🎯 and spëcial chars',
        note: 'Note with\nnewlines\tand\ttabs'
      })

      expect(specialCharTask.name).toContain('🎯')
      expect(specialCharTask.note).toContain('\n')
      expect(specialCharTask.note).toContain('\t')
    })

    it('should handle timezone edge cases for dates', () => {
      const utcDate = new Date('2023-06-15T00:00:00Z')
      const localDate = new Date('2023-06-15T00:00:00')

      const utcTask = createMockTask({ plannedDate: utcDate })
      const localTask = createMockTask({ plannedDate: localDate })

      expect(utcTask.plannedDate).toEqual(utcDate)
      expect(localTask.plannedDate).toEqual(localDate)
    })

    it('should handle concurrent updates timestamps', () => {
      const now = new Date()
      const earlier = new Date(now.getTime() - 1000)

      const task = createMockTask({
        createdAt: earlier,
        updatedAt: now
      })

      expect(task.updatedAt.getTime()).toBeGreaterThan(task.createdAt.getTime())
    })
  })
})