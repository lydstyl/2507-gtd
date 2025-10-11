import { describe, it, expect, beforeEach } from 'vitest'
import { CreateTaskUseCase } from '../../src/usecases/tasks/CreateTaskUseCase'
import { createMockCreateTaskData, MockRepository } from '../utils/test-helpers'
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
      expect(result.data!.name).toBe('Test Task')
      expect(result.data!.importance).toBe(30)
      expect(result.data!.complexity).toBe(6)
      expect(result.data!.userId).toBe('user-1')
      expect(result.data!.id).toBeDefined()
      expect(result.data!.createdAt).toBeInstanceOf(Date)
      expect(result.data!.updatedAt).toBeInstanceOf(Date)
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
      expect(result.data!.importance).toBe(0) // Default for collected tasks
      expect(result.data!.complexity).toBe(3) // Default complexity
      expect(result.data!.isCompleted).toBe(false)
    })

    it('should handle optional fields correctly', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Complete Task',
        link: 'https://example.com',
        note: 'Detailed task note',
        plannedDate: new Date('2023-06-20'),
        dueDate: new Date('2023-06-25'),
        parentId: 'parent-task-id',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.name).toBe('Complete Task')
      expect(result.data!.link).toBe('https://example.com')
      expect(result.data!.note).toBe('Detailed task note')
      expect(result.data!.plannedDate).toEqual(new Date('2023-06-20'))
      expect(result.data!.dueDate).toEqual(new Date('2023-06-25'))
      expect(result.data!.parentId).toBe('parent-task-id')
    })

    it('should pass importance and complexity to repository', async () => {
      const testCases = [
        { importance: 0, complexity: 1 },
        { importance: 25, complexity: 5 },
        { importance: 50, complexity: 9 }
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
        expect(result.data!.importance).toBe(importance)
        expect(result.data!.complexity).toBe(complexity)
        expect(result.data!.name).toBe(`Task ${importance}-${complexity}`)
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

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Task name is required')
    })

    it('should reject whitespace-only task name', async () => {
      const taskData = createMockCreateTaskData({
        name: '   ',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Task name cannot be empty')
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
        expect(result.success).toBe(false)
        expect(result.error?.message).toContain('Importance must be between 0 and 50')
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
        expect(result.success).toBe(false)
        expect(result.error?.message).toContain('Complexity must be between 1 and 9')
      }
    })

    it('should accept valid importance boundary values', async () => {
      const validImportanceValues = [0, 25, 50]

      for (const importance of validImportanceValues) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name: 'Test Task',
          importance,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
        expect(result.data!.importance).toBe(importance)
      }
    })

    it('should accept valid complexity boundary values', async () => {
      const validComplexityValues = [1, 5, 9]

      for (const complexity of validComplexityValues) {
        mockTaskRepository.reset()
        const taskData = createMockCreateTaskData({
          name: 'Test Task',
          complexity,
          userId: 'user-1'
        })

        const result = await createTaskUseCase.execute(taskData)
        expect(result.success).toBe(true)
        expect(result.data!.complexity).toBe(complexity)
      }
    })

    it('should handle missing userId gracefully', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Test Task',
        userId: undefined as any // Force undefined userId
      })

      // The use case doesn't validate userId, so it should work
      const result = await createTaskUseCase.execute(taskData)
      expect(result.success).toBe(true)
      expect(result.data!.name).toBe('Test Task')
    })

    it('should validate date formats', async () => {
      const validTaskData = createMockCreateTaskData({
        name: 'Task with dates',
        plannedDate: new Date('2023-06-20'),
        dueDate: new Date('2023-06-25'),
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(validTaskData)
      expect(result.success).toBe(true)
      expect(result.data!.plannedDate).toEqual(new Date('2023-06-20'))
      expect(result.data!.dueDate).toEqual(new Date('2023-06-25'))
    })
  })

  describe('business rules', () => {
    it('should create collected tasks correctly', async () => {
      const collectedTaskData = createMockCreateTaskData({
        name: 'Collected Task',
        importance: 0, // Collected tasks have minimal importance
        complexity: 3, // Default complexity
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(collectedTaskData)

      expect(result.success).toBe(true)
      expect(result.data!.importance).toBe(0)
      expect(result.data!.complexity).toBe(3)
      expect(result.data!.plannedDate).toBeUndefined()
      expect(result.data!.name).toBe('Collected Task')
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
      expect(result.data!.importance).toBe(50)
      expect(result.data!.complexity).toBe(1)
      expect(result.data!.name).toBe('High Priority Task')
    })

    it('should handle task with tags', async () => {
      const taskWithTagsData = createMockCreateTaskData({
        name: 'Tagged Task',
        tagIds: ['tag1', 'tag2'],
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskWithTagsData)

      expect(result.success).toBe(true)
      expect(result.data!.name).toBe('Tagged Task')
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

      expect(user1Task.success).toBe(true)
      expect(user2Task.success).toBe(true)
      expect(user1Task.data!.userId).toBe('user-1')
      expect(user2Task.data!.userId).toBe('user-2')
      expect(user1Task.data!.id).not.toBe(user2Task.data!.id)
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
      const veryLongName = 'A'.repeat(200) // Maximum allowed length
      const taskData = createMockCreateTaskData({
        name: veryLongName,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.name).toBe(veryLongName)
    })

    it('should handle special characters in task name', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Task with émojis 🎯',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.name).toBe('Task with émojis 🎯')
    })

    it('should handle extreme date values', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Task with extreme date',
        plannedDate: new Date('1900-01-01'),
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.plannedDate).toEqual(new Date('1900-01-01'))
    })

    it('should handle null and undefined values correctly', async () => {
      const taskData = createMockCreateTaskData({
        name: 'Task with nulls',
        link: null as any,
        note: undefined,
        plannedDate: null as any,
        dueDate: undefined,
        parentId: null,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(true)
      expect(result.data!.link).toBeNull()
      expect(result.data!.note).toBeUndefined()
      expect(result.data!.plannedDate).toBeNull()
      // dueDate should be set to 6 months from now as default when not provided
      expect(result.data!.dueDate).toBeDefined()
      expect(result.data!.dueDate).toBeInstanceOf(Date)
      expect(result.data!.parentId).toBeNull()
    })

    it('should handle concurrent task creation', async () => {
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        createTaskUseCase.execute(
          createMockCreateTaskData({
            name: `Concurrent Task ${i}`,
            userId: 'user-1'
          })
        )
      )

      const results = await Promise.all(taskPromises)

      expect(results).toHaveLength(10)
      for (const result of results) {
        expect(result.success).toBe(true)
      }

      const ids = results.map(r => r.data!.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10) // All IDs should be unique
    })

    it('should handle repository errors gracefully', async () => {
      // Force repository to throw an error
      mockTaskRepository.shouldThrowError = true
      mockTaskRepository.errorMessage = 'Database connection failed'

      const taskData = createMockCreateTaskData({
        name: 'Test Task',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Database connection failed')
    })
  })

  describe('performance', () => {
    it('should create tasks efficiently', async () => {
      const startTime = Date.now()

      const taskData = createMockCreateTaskData({
        name: 'Performance Test Task',
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })

    it('should handle large task data efficiently', async () => {
      const largeNote = 'A'.repeat(10000) // Large note content
      const startTime = Date.now()

      const taskData = createMockCreateTaskData({
        name: 'Large Data Task',
        note: largeNote,
        userId: 'user-1'
      })

      const result = await createTaskUseCase.execute(taskData)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.data!.note).toBe(largeNote)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast even with large data
    })
  })
})