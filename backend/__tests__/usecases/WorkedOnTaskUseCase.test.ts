import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkedOnTaskUseCase } from '../../src/usecases/tasks/WorkedOnTaskUseCase'
import { createMockTask } from '../utils/test-helpers'

describe('WorkedOnTaskUseCase', () => {
  let workedOnTaskUseCase: WorkedOnTaskUseCase
  let mockTaskRepository: {
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockTaskRepository = {
      findById: vi.fn(),
      create: vi.fn(),
    }
    workedOnTaskUseCase = new WorkedOnTaskUseCase(mockTaskRepository as any)
  })

  describe('execute', () => {
    it('crée une copie "worked on" complétée avec le titre seul', async () => {
      const original = createMockTask({
        id: 'task-1',
        name: 'Préparer la réunion',
        userId: 'user-1',
        note: 'note secrète',
        link: 'https://example.com',
        plannedDate: new Date('2023-06-20'),
      })
      const workedOn = createMockTask({
        id: 'task-2',
        name: 'Préparer la réunion',
        userId: 'user-1',
        isCompleted: true,
      })
      mockTaskRepository.findById.mockResolvedValue(original)
      mockTaskRepository.create.mockResolvedValue(workedOn)

      const result = await workedOnTaskUseCase.execute('task-1', 'user-1')

      expect(result).toEqual(workedOn)
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        name: 'Préparer la réunion',
        importance: 50,
        complexity: 1,
        userId: 'user-1',
        isCompleted: true,
        plannedDate: undefined,
        parentId: undefined,
        note: undefined,
        link: undefined,
      })
    })

    it('refuse si la tâche n’existe pas', async () => {
      mockTaskRepository.findById.mockResolvedValue(null)

      await expect(workedOnTaskUseCase.execute('ghost', 'user-1')).rejects.toThrow(
        'Task not found'
      )
      expect(mockTaskRepository.create).not.toHaveBeenCalled()
    })

    it('refuse si la tâche appartient à un autre utilisateur (sécurité)', async () => {
      const task = createMockTask({ id: 'task-1', userId: 'user-A' })
      mockTaskRepository.findById.mockResolvedValue(task)

      await expect(workedOnTaskUseCase.execute('task-1', 'user-B')).rejects.toThrow(
        'Access denied'
      )
      expect(mockTaskRepository.create).not.toHaveBeenCalled()
    })

    it('propage les erreurs du repository', async () => {
      const task = createMockTask({ id: 'task-1', userId: 'user-1' })
      mockTaskRepository.findById.mockResolvedValue(task)
      mockTaskRepository.create.mockRejectedValue(new Error('DB down'))

      await expect(workedOnTaskUseCase.execute('task-1', 'user-1')).rejects.toThrow('DB down')
    })
  })
})
