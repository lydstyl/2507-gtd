import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CleanupOldCompletedTasksUseCase } from '../../src/usecases/cleanup/CleanupOldCompletedTasksUseCase'

describe('CleanupOldCompletedTasksUseCase', () => {
  let useCase: CleanupOldCompletedTasksUseCase
  let mockTaskRepository: {
    clearOldTaskNotes: ReturnType<typeof vi.fn>
    deleteOldCompletedTasks: ReturnType<typeof vi.fn>
  }

  const ONE_YEAR_AGO_MS = 365 * 24 * 60 * 60 * 1000
  const THREE_YEARS_AGO_MS = 3 * 365 * 24 * 60 * 60 * 1000

  beforeEach(() => {
    mockTaskRepository = {
      clearOldTaskNotes: vi.fn(),
      deleteOldCompletedTasks: vi.fn(),
    }
    useCase = new CleanupOldCompletedTasksUseCase(mockTaskRepository as any)
  })

  describe('execute', () => {
    it('vide les notes des tâches terminées depuis plus d’un an', async () => {
      mockTaskRepository.clearOldTaskNotes.mockResolvedValue(42)
      mockTaskRepository.deleteOldCompletedTasks.mockResolvedValue(0)

      const now = Date.now()
      const result = await useCase.execute()

      expect(mockTaskRepository.clearOldTaskNotes).toHaveBeenCalledTimes(1)
      const cutoff = (mockTaskRepository.clearOldTaskNotes.mock.calls[0][0] as Date).getTime()
      expect(now - cutoff).toBeGreaterThanOrEqual(ONE_YEAR_AGO_MS - 60_000)
      expect(now - cutoff).toBeLessThanOrEqual(ONE_YEAR_AGO_MS + 60_000)
      expect(result.notesClearedCount).toBe(42)
    })

    it('supprime les tâches terminées depuis plus de trois ans', async () => {
      mockTaskRepository.clearOldTaskNotes.mockResolvedValue(0)
      mockTaskRepository.deleteOldCompletedTasks.mockResolvedValue(7)

      const now = Date.now()
      const result = await useCase.execute()

      expect(mockTaskRepository.deleteOldCompletedTasks).toHaveBeenCalledTimes(1)
      const cutoff = (mockTaskRepository.deleteOldCompletedTasks.mock.calls[0][0] as Date).getTime()
      expect(now - cutoff).toBeGreaterThanOrEqual(THREE_YEARS_AGO_MS - 60_000)
      expect(now - cutoff).toBeLessThanOrEqual(THREE_YEARS_AGO_MS + 60_000)
      expect(result.deletedCount).toBe(7)
    })

    it('applique d’abord la purge des notes, puis la suppression complète', async () => {
      mockTaskRepository.clearOldTaskNotes.mockResolvedValue(1)
      mockTaskRepository.deleteOldCompletedTasks.mockResolvedValue(1)

      const order: string[] = []
      mockTaskRepository.clearOldTaskNotes.mockImplementation(async () => {
        order.push('notes')
        return 1
      })
      mockTaskRepository.deleteOldCompletedTasks.mockImplementation(async () => {
        order.push('delete')
        return 1
      })

      await useCase.execute()

      expect(order).toEqual(['notes', 'delete'])
    })

    it('propage les erreurs du repository', async () => {
      mockTaskRepository.clearOldTaskNotes.mockRejectedValue(new Error('DB down'))

      await expect(useCase.execute()).rejects.toThrow('DB down')
      expect(mockTaskRepository.deleteOldCompletedTasks).not.toHaveBeenCalled()
    })
  })
})
