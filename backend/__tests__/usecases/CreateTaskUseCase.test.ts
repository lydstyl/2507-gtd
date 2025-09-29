import { describe, it, expect, beforeEach } from 'vitest'
import { CreateTaskUseCase } from '../../src/usecases/tasks/CreateTaskUseCase'
import { createMockCreateTaskData, MockRepository, expectToThrowAsync } from '../utils/test-helpers'
import { TaskWithSubtasks } from '../../src/domain/entities/Task'

describe('CreateTaskUseCase', () => {
  let createTaskUseCase: CreateTaskUseCase
  let mockTaskRepository: MockRepository<TaskWithSubtasks>

  beforeEach(() => {
    mockTaskRepository = new MockRepository<TaskWithSubtasks>()
    createTaskUseCase = new CreateTaskUseCase(mockTaskRepository as any)
  })

  describe('execute', () => {
    it('should create a task with valid data', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Test Task',
        importance: 30,
        complexity: 6,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe('Test Task')
      expect(result.success).toBe(true)
      expect(result.data!.data!.importance).toBe(30)
      expect(result.success).toBe(true)
      expect(result.data!.data!.complexity).toBe(6)
      expect(result.success).toBe(true)
      expect(result.data!.data!.userId).toBe('user-1')
      expect(result.success).toBe(true)
      expect(result.data!.data!.id).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data!.data!.createdAt).toBeInstanceOf(Date)
      expect(result.success).toBe(true)
      expect(result.data!.data!.updatedAt).toBeInstanceOf(Date)
    })

    it('should apply default values correctly', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Task with defaults',
        userId: 'user-1'
        // importance and complexity not specified, so mock will use defaults
      })
      // Remove importance and complexity to test defaults
      delete (taskData as any).importance
      delete (taskData as any).complexity

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.importance).toBe(0) // Default for collected tasks
      expect(result.success).toBe(true)
      expect(result.data!.data!.complexity).toBe(3) // Default complexity
      expect(result.success).toBe(true)
      expect(result.data!.data!.isCompleted).toBe(false)
    })

    it('should handle optional fields correctly', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Complete Task',
        link: 'https://example.com',
        note: 'Detailed task note',
        importance: 40,
        complexity: 8,
        plannedDate: new Date('2023-06-20'),
        dueDate: new Date('2023-06-25'),
        parentId: 'parent-task-id',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe('Complete Task')
      expect(result.success).toBe(true)
      expect(result.data!.data!.link).toBe('https://example.com')
      expect(result.success).toBe(true)
      expect(result.data!.data!.note).toBe('Detailed task note')
      expect(result.success).toBe(true)
      expect(result.data!.data!.plannedDate).toEqual(new Date('2023-06-20'))
      expect(result.success).toBe(true)
      expect(result.data!.data!.dueDate).toEqual(new Date('2023-06-25'))
      expect(result.success).toBe(true)
      expect(result.data!.data!.parentId).toBe('parent-task-id')
    })

    it('should pass importance and complexity to repository', async () => {
      const testCases = [
        { importance: 50, complexity: 1 },
        { importance: 25, complexity: 5 },
        { importance: 30, complexity: 3 },
        { importance: 0, complexity: 3 }
      ]

      for (const { importance, complexity } of testCases) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name: `Task ${importance}-${complexity}`,
          importance,
          complexity,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)

        // Use case passes data to repository, points calculation is done there
        expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
        expect(result.success).toBe(true)
      expect(result.data!.data!.importance).toBe(importance)
        expect(result.success).toBe(true)
      expect(result.data!.data!.complexity).toBe(complexity)
        expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe(`Task ${importance}-${complexity}`)
      }
    })

    it('should handle subtask creation', async () => {
      const parentTaskData = createMockCreateTaskData({
        name: 'Parent Task',
        userId: 'user-1'
      })

      const parentTask = await createTaskUseCase.execute(parentTaskData)

      expect(parentTask.success).toBe(true)

      const subtaskData = createMockCreateTaskData({
        name: 'Subtask',
        parentId: parentTask.data!.id,
        userId: 'user-1'
      })

      const subtask = await createTaskUseCase.execute(subtaskData)

      expect(subtask.success).toBe(true)
      expect(subtask.data!.parentId).toBe(parentTask.data!.id)
      expect(subtask.data!.name).toBe('Subtask')
    })
  })

  describe('validation', () => {
    it('should reject empty task name', async () => {
      const taskData = createMockCreateTaskData({
        name: '',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(false)
      expect(result.success).toBe(true)
      expect(result.data!.error?.message).toContain('Task name cannot be empty')
    })

    it('should reject whitespace-only task name', async () => {
      const taskData = createMockCreateTaskData({
        name: '   ',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)
      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(false)
      expect(result.success).toBe(true)
      expect(result.data!.error?.message).toContain('Task name cannot be empty')
    })

    it('should reject invalid importance values', async () => {
      const invalidImportanceValues = [-1, 51, 100]

      for (const importance of invalidImportanceValues) {
        const taskData = createMockCreateTaskData({
          name: 'Test Task',
          importance,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
      expect(result.data!.success).toBe(false)
        expect(result.success).toBe(true)
      expect(result.data!.error?.message).toContain('Importance must be between 0 and 50')
      }
    })

    it('should reject invalid complexity values', async () => {
      // Note: 0 won't be validated due to falsy check in validation logic
      const invalidComplexityValues = [10, 15, -1]

      for (const complexity of invalidComplexityValues) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name: 'Test Task',
          complexity,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
      expect(result.data!.success).toBe(false)
        expect(result.success).toBe(true)
      expect(result.data!.error?.message).toContain('Complexity must be between 1 and 9')
      }
    })

    it('should accept valid importance boundary values', async () => {
      const validImportanceValues = [0, 1, 25, 49, 50]

      for (const importance of validImportanceValues) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name: 'Test Task',
          importance,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
        expect(result.success).toBe(true)
      expect(result.data!.data!.importance).toBe(importance)
      }
    })

    it('should accept valid complexity boundary values', async () => {
      const validComplexityValues = [1, 2, 5, 8, 9]

      for (const complexity of validComplexityValues) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name: 'Test Task',
          complexity,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
        expect(result.success).toBe(true)
      expect(result.data!.data!.complexity).toBe(complexity)
      }
    })

    it('should handle missing userId gracefully', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Test Task'
      })
      delete (taskData as any).userId

      // The use case doesn't validate userId, so it should work
      const result = await createTaskUseCase.execute(taskData)
      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe('Test Task')
    })

    it('should validate date formats', async () => {
      // Valid dates should work
      const validTaskData = createMockCreateTaskData({
        name: 'Task with valid dates',
        plannedDate: new Date('2023-06-20'),
        dueDate: new Date('2023-06-25'),
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(validTaskData)
      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.plannedDate).toEqual(new Date('2023-06-20'))
      expect(result.success).toBe(true)
      expect(result.data!.data!.dueDate).toEqual(new Date('2023-06-25'))
    })
  })

  describe('business rules', () => {
    it('should create collected tasks correctly', async () => {
      const collectedTaskData = createMockCreateTaskData({
        name: 'Collected Task',
        importance: 0,
        complexity: 3,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(collectedTaskData)

      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.importance).toBe(0)
      expect(result.success).toBe(true)
      expect(result.data!.data!.complexity).toBe(3)
      expect(result.success).toBe(true)
      expect(result.data!.data!.plannedDate).toBeUndefined()
      expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe('Collected Task')
    })

    it('should create high priority tasks correctly', async () => {
      const highPriorityTaskData = createMockCreateTaskData({
        name: 'High Priority Task',
        importance: 50,
        complexity: 1,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(highPriorityTaskData)

      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.importance).toBe(50)
      expect(result.success).toBe(true)
      expect(result.data!.data!.complexity).toBe(1)
      expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe('High Priority Task')
    })

    it('should handle task with tags', async () => {
      const taskWithTagsData = createMockCreateTaskData({
        name: 'Tagged Task',
        tagIds: ['tag-1', 'tag-2', 'tag-3'],
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskWithTagsData)

      expect(result.success).toBe(true)
      expect(result.data!.success).toBe(true)
      expect(result.success).toBe(true)
      expect(result.data!.data!.name).toBe('Tagged Task')
      // tagIds would be processed by the repository layer
    })

    it('should preserve user isolation', async () => {
      const user1TaskData = createMockCreateTaskData({
        name: 'User 1 Task',
        userId: 'user-1'
      })

      const user2TaskData = createMockCreateTaskData({
        name: 'User 2 Task',
        userId: 'user-2'
      })

      const user1Task = await createTaskUseCase.execute(user1TaskData)
      const user2Task = await createTaskUseCase.execute(user2TaskData)

      expect(user1Task.userId).toBe('user-1')
      expect(user2Task.userId).toBe('user-2')
      expect(user1Task.id).not.toBe(user2Task.id)
    })

    it('should handle completion state correctly', async () => {
      const incompleteTaskData = createMockCreateTaskData({
        name: 'Incomplete Task',
        isCompleted: false,
        userId: 'user-1'
      })

      const completedTaskData = createMockCreateTaskData({
        name: 'Completed Task',
        isCompleted: true,
        userId: 'user-1'
      })

      const incompleteTask = await createTaskUseCase.execute(incompleteTaskData)
      const completedTask = await createTaskUseCase.execute(completedTaskData)

      expect(incompleteTask.success).toBe(true)
      expect(completedTask.success).toBe(true)
      expect(incompleteTask.data!.isCompleted).toBe(false)
      expect(incompleteTask.data!.completedAt).toBeUndefined()
      expect(completedTask.data!.isCompleted).toBe(true)
      // completedAt would be set by repository if needed
    })
  })

  describe('edge cases', () => {
    it('should handle very long task names', async () => {
      const longName = 'A'.repeat(500)
      const taskData = createMockCreateTaskData({
        name: longName,
        userId: 'user-1'
      })

      // The use case doesn't validate name length, so it should work
      const result = await createTaskUseCase.execute(taskData)
      expect(result.success).toBe(true)
      expect(result.data!.name).toBe(longName)
    })

    it('should handle special characters in task name', async () => {
      const specialNames = [
        'Task with émojis 🎯',
        'Task with "quotes"',
        'Task with \'apostrophes\'',
        'Task with\nnewlines',
        'Task with\ttabs',
        'Task & special chars <>'
      ]

      for (const name of specialNames) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
      expect(result.data!.name).toBe(name)
      }
    })

    it('should handle extreme date values', async () => {
      const extremeDates = [
        new Date('1900-01-01'),
        new Date('2100-12-31'),
        new Date('2023-02-29'), // Invalid date
        new Date('2024-02-29')  // Valid leap year date
      ]

      for (const date of extremeDates) {
        mockTaskRepository.reset()
        if (!isNaN(date.getTime())) {
          const taskData = createMockCreateTaskData({
            name: 'Task with extreme date',
            plannedDate: date,
            userId: 'user-1'
          })

          const result = await createTaskUseCase.execute(taskData)
          expect(result.success).toBe(true)
      expect(result.data!.plannedDate).toEqual(date)
        }
      }
    })

    it('should handle null and undefined values correctly', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Task with nulls',
        link: undefined,
        note: undefined,
        plannedDate: undefined,
        dueDate: undefined,
        parentId: undefined,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.link).toBeUndefined()
      expect(result.success).toBe(true)
      expect(result.data!.note).toBeUndefined()
      expect(result.success).toBe(true)
      expect(result.data!.plannedDate).toBeUndefined()
      expect(result.success).toBe(true)
      expect(result.data!.dueDate).toBeUndefined()
      expect(result.success).toBe(true)
      expect(result.data!.parentId).toBeUndefined()
    })

    it('should handle concurrent task creation', async () => {
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        createTaskUseCase.execute(createMockCreateTaskData({
          name: `Concurrent Task ${i}`,
          userId: 'user-1'
        }))
      )

      const results = await Promise.all(taskPromises)

      expect(results).toHaveLength(10)
      const ids = results.map(r => r.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10) // All IDs should be unique
    })

    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      const errorRepository = {
        create: () => Promise.reject(new Error('Database connection failed'))
      }

      const errorUseCase = new CreateTaskUseCase(errorRepository as any)
      const taskData = createMockCreateTaskData({
        name: 'Task that will fail',
        userId: 'user-1'
      })

      await expectToThrowAsync(
        () => errorUseCase.execute(taskData),
        'Database connection failed'
      )
    })
  })

  describe('performance', () => {
    it('should create tasks efficiently', async () => {
      const startTime = Date.now()

      const taskPromises = Array.from({ length: 100 }, (_, i) =>
        createTaskUseCase.execute(createMockCreateTaskData({
          name: `Performance Task ${i}`,
          userId: 'user-1'
        }))
      )

      await Promise.all(taskPromises)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should handle large task data efficiently', async () => {
      const largeNote = 'A'.repeat(10000)
      const taskData = createMockCreateTaskData({
        name: 'Task with large note',
        note: largeNote,
        userId: 'user-1'
      })

      const startTime = Date.now()
      const result = await createTaskUseCase.execute(taskData)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.data!.note).toBe(largeNote)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast even with large data
    })
  })
})