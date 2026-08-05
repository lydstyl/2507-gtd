import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateTagUseCase } from '../../src/usecases/tags/CreateTagUseCase'
import { createMockTag } from '../utils/test-helpers'

describe('CreateTagUseCase', () => {
  let createTagUseCase: CreateTagUseCase
  let mockTagRepository: {
    findAll: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockTagRepository = {
      findAll: vi.fn(),
      create: vi.fn(),
    }
    createTagUseCase = new CreateTagUseCase(mockTagRepository as any)
  })

  describe('execute', () => {
    it('crée un tag valide', async () => {
      mockTagRepository.findAll.mockResolvedValue([])
      mockTagRepository.create.mockResolvedValue(createMockTag({ id: 'tag-1', name: 'actif' }))

      const result = await createTagUseCase.execute({
        name: 'actif',
        userId: 'user-1',
      })

      expect(result.success).toBe(true)
      expect(mockTagRepository.create).toHaveBeenCalledWith({
        name: 'actif',
        userId: 'user-1',
      })
    })

    it('rejette un nom vide (validation partagée)', async () => {
      const result = await createTagUseCase.execute({
        name: '',
        userId: 'user-1',
      })

      expect(result.success).toBe(false)
      expect(mockTagRepository.create).not.toHaveBeenCalled()
    })

    it('rejette un doublon pour le même utilisateur', async () => {
      mockTagRepository.findAll.mockResolvedValue([
        createMockTag({ id: 'tag-1', name: 'actif', userId: 'user-1' }),
      ])

      const result = await createTagUseCase.execute({
        name: 'actif',
        userId: 'user-1',
      })

      expect(result.success).toBe(false)
      expect(mockTagRepository.create).not.toHaveBeenCalled()
    })

    it('autorise le même nom pour deux utilisateurs différents', async () => {
      // Le vrai repository filtre par userId — le mock doit faire pareil
      mockTagRepository.findAll.mockImplementation(async (userId: string) =>
        userId === 'user-A' ? [createMockTag({ id: 'tag-1', name: 'actif', userId: 'user-A' })] : []
      )
      mockTagRepository.create.mockResolvedValue(
        createMockTag({ id: 'tag-2', name: 'actif', userId: 'user-B' })
      )

      const result = await createTagUseCase.execute({
        name: 'actif',
        userId: 'user-B',
      })

      expect(result.success).toBe(true)
      expect(mockTagRepository.findAll).toHaveBeenCalledWith('user-B')
    })

    it('propage les erreurs du repository', async () => {
      mockTagRepository.findAll.mockRejectedValue(new Error('DB down'))

      const result = await createTagUseCase.execute({
        name: 'actif',
        userId: 'user-1',
      })

      expect(result.success).toBe(false)
    })
  })
})
