import { describe, it, expect } from 'vitest'
import { ParentDateSyncService } from '../ParentDateSyncService'
import { GenericTask } from '../../entities/TaskTypes'

describe('ParentDateSyncService', () => {
  const createMockTask = (overrides: Partial<GenericTask<string>> = {}): GenericTask<string> => ({
    id: 'task-1',
    name: 'Test Task',
    importance: 5,
    complexity: 3,
    points: 150,
    position: 0,
    userId: 'user-1',
    isCompleted: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  })

  describe('calculateParentDates', () => {
    it('should return undefined dates when there are no children', () => {
      const result = ParentDateSyncService.calculateParentDates([])

      expect(result.plannedDate).toBeUndefined()
      expect(result.dueDate).toBeUndefined()
    })

    it('should return undefined dates when all children are completed', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: true,
          plannedDate: '2025-01-15T00:00:00.000Z',
          dueDate: '2025-01-20T00:00:00.000Z',
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: true,
          plannedDate: '2025-01-10T00:00:00.000Z',
          dueDate: '2025-01-18T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.plannedDate).toBeUndefined()
      expect(result.dueDate).toBeUndefined()
    })

    it('should find the earliest plannedDate from active children', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          plannedDate: '2025-01-15T00:00:00.000Z',
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: false,
          plannedDate: '2025-01-10T00:00:00.000Z', // earliest
        }),
        createMockTask({
          id: 'child-3',
          isCompleted: false,
          plannedDate: '2025-01-20T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.plannedDate).toBe('2025-01-10T00:00:00.000Z')
    })

    it('should find the earliest dueDate from active children', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          dueDate: '2025-01-25T00:00:00.000Z',
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: false,
          dueDate: '2025-01-18T00:00:00.000Z', // earliest
        }),
        createMockTask({
          id: 'child-3',
          isCompleted: false,
          dueDate: '2025-01-30T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.dueDate).toBe('2025-01-18T00:00:00.000Z')
    })

    it('should ignore completed children when calculating dates', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: true,
          plannedDate: '2025-01-05T00:00:00.000Z', // earlier but completed
          dueDate: '2025-01-08T00:00:00.000Z',
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: false,
          plannedDate: '2025-01-15T00:00:00.000Z',
          dueDate: '2025-01-20T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.plannedDate).toBe('2025-01-15T00:00:00.000Z')
      expect(result.dueDate).toBe('2025-01-20T00:00:00.000Z')
    })

    it('should handle children without plannedDate', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          plannedDate: undefined,
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: false,
          plannedDate: '2025-01-15T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.plannedDate).toBe('2025-01-15T00:00:00.000Z')
    })

    it('should handle children without dueDate', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          dueDate: undefined,
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: false,
          dueDate: '2025-01-20T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.dueDate).toBe('2025-01-20T00:00:00.000Z')
    })

    it('should return undefined when no children have dates', () => {
      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
        }),
        createMockTask({
          id: 'child-2',
          isCompleted: false,
        }),
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.plannedDate).toBeUndefined()
      expect(result.dueDate).toBeUndefined()
    })

    it('should work with Date objects (backend)', () => {
      const children: GenericTask<Date>[] = [
        {
          ...createMockTask(),
          plannedDate: new Date('2025-01-15'),
          dueDate: new Date('2025-01-20'),
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        } as GenericTask<Date>,
        {
          ...createMockTask({ id: 'child-2' }),
          plannedDate: new Date('2025-01-10'), // earliest
          dueDate: new Date('2025-01-18'), // earliest
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        } as GenericTask<Date>,
      ]

      const result = ParentDateSyncService.calculateParentDates(children)

      expect(result.plannedDate).toEqual(new Date('2025-01-10'))
      expect(result.dueDate).toEqual(new Date('2025-01-18'))
    })
  })

  describe('shouldUpdateParentDates', () => {
    it('should return true when parent dates differ from calculated dates', () => {
      const parent = createMockTask({
        id: 'parent',
        plannedDate: '2025-01-20T00:00:00.000Z',
        dueDate: '2025-01-25T00:00:00.000Z',
      })

      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          plannedDate: '2025-01-10T00:00:00.000Z',
          dueDate: '2025-01-15T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.shouldUpdateParentDates(parent, children)

      expect(result).toBe(true)
    })

    it('should return false when parent dates match calculated dates', () => {
      const parent = createMockTask({
        id: 'parent',
        plannedDate: '2025-01-10T00:00:00.000Z',
        dueDate: '2025-01-15T00:00:00.000Z',
      })

      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          plannedDate: '2025-01-10T00:00:00.000Z',
          dueDate: '2025-01-15T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.shouldUpdateParentDates(parent, children)

      expect(result).toBe(false)
    })

    it('should return true when parent has dates but children have none', () => {
      const parent = createMockTask({
        id: 'parent',
        plannedDate: '2025-01-10T00:00:00.000Z',
        dueDate: '2025-01-15T00:00:00.000Z',
      })

      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
        }),
      ]

      const result = ParentDateSyncService.shouldUpdateParentDates(parent, children)

      expect(result).toBe(true)
    })

    it('should return true when parent has no dates but children have dates', () => {
      const parent = createMockTask({
        id: 'parent',
      })

      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
          plannedDate: '2025-01-10T00:00:00.000Z',
          dueDate: '2025-01-15T00:00:00.000Z',
        }),
      ]

      const result = ParentDateSyncService.shouldUpdateParentDates(parent, children)

      expect(result).toBe(true)
    })

    it('should return false when both parent and children have no dates', () => {
      const parent = createMockTask({
        id: 'parent',
      })

      const children = [
        createMockTask({
          id: 'child-1',
          isCompleted: false,
        }),
      ]

      const result = ParentDateSyncService.shouldUpdateParentDates(parent, children)

      expect(result).toBe(false)
    })
  })
})
