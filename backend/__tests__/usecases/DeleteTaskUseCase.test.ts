import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeleteTaskUseCase } from '../../src/usecases/tasks/DeleteTaskUseCase'
import { createMockTask } from '../utils/test-helpers'

describe('DeleteTaskUseCase', () => {
  let deleteTaskUseCase: DeleteTaskUseCase
  let mockTaskRepository: {
    findById: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    deleteAllByUserId: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockTaskRepository = {
      findById: vi.fn(),
      delete: vi.fn(),
      deleteAllByUserId: vi.fn(),
    }
    deleteTaskUseCase = new DeleteTaskUseCase(mockTaskRepository as any)
  })

  describe('execute', () => {
    it('supprime une tâche appartenant à l’utilisateur', async () => {
      const task = createMockTask({ id: 'task-1', userId: 'user-1' })
      mockTaskRepository.findById.mockResolvedValue(task)
      mockTaskRepository.delete.mockResolvedValue(true)

      await deleteTaskUseCase.execute('task-1', 'user-1')

      expect(mockTaskRepository.delete).toHaveBeenCalledWith('task-1')
    })

    it('refuse la suppression si la tâche n’existe pas', async () => {
      mockTaskRepository.findById.mockResolvedValue(null)

      await expect(deleteTaskUseCase.execute('ghost', 'user-1')).rejects.toThrow(
        'Task not found or access denied'
      )
      expect(mockTaskRepository.delete).not.toHaveBeenCalled()
    })

    it('refuse la suppression si la tâche appartient à un autre utilisateur', async () => {
      const task = createMockTask({ id: 'task-1', userId: 'user-A' })
      mockTaskRepository.findById.mockResolvedValue(task)

      await expect(deleteTaskUseCase.execute('task-1', 'user-B')).rejects.toThrow(
        'Task not found or access denied'
      )
      expect(mockTaskRepository.delete).not.toHaveBeenCalled()
    })

    it('propage les erreurs du repository', async () => {
      const task = createMockTask({ id: 'task-1', userId: 'user-1' })
      mockTaskRepository.findById.mockResolvedValue(task)
      mockTaskRepository.delete.mockRejectedValue(new Error('DB down'))

      await expect(deleteTaskUseCase.execute('task-1', 'user-1')).rejects.toThrow('DB down')
    })
  })

  describe('deleteAllByUserId', () => {
    it('délègue la suppression de masse au repository', async () => {
      mockTaskRepository.deleteAllByUserId.mockResolvedValue(undefined)

      await deleteTaskUseCase.deleteAllByUserId('user-1')

      expect(mockTaskRepository.deleteAllByUserId).toHaveBeenCalledWith('user-1')
    })
  })
})
