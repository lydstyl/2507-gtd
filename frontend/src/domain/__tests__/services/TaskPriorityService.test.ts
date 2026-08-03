import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaskPriorityUIService } from '../../services/TaskPriorityUIService'
import { createMockTaskEntity, createTestTasksByCategory, createTestDates } from '../../../__tests__/utils/test-helpers'

describe('TaskPriorityUIService', () => {
  let fixedDate: Date
  let dates: ReturnType<typeof createTestDates>

  beforeEach(() => {
    fixedDate = new Date('2023-06-15T12:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
    dates = createTestDates(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getPriorityColor', () => {
    it('should return quadrant colors for importance ranges', () => {
      expect(TaskPriorityUIService.getPriorityColor(100)).toBe('bg-gray-400')
      expect(TaskPriorityUIService.getPriorityColor(199)).toBe('bg-gray-400')
      expect(TaskPriorityUIService.getPriorityColor(200)).toBe('bg-orange-500')
      expect(TaskPriorityUIService.getPriorityColor(299)).toBe('bg-orange-500')
      expect(TaskPriorityUIService.getPriorityColor(300)).toBe('bg-blue-500')
      expect(TaskPriorityUIService.getPriorityColor(399)).toBe('bg-blue-500')
      expect(TaskPriorityUIService.getPriorityColor(400)).toBe('bg-red-500')
      expect(TaskPriorityUIService.getPriorityColor(499)).toBe('bg-red-500')
    })

    it('should handle out-of-range values gracefully', () => {
      const color = TaskPriorityUIService.getPriorityColor(50)
      expect(color).toMatch(/^bg-/) // Should start with 'bg-'
      expect(typeof color).toBe('string')
    })
  })

  describe('getPriorityDescription', () => {
    it('should return correct descriptions for importance quadrants', () => {
      expect(TaskPriorityUIService.getPriorityDescription(100)).toBe('Basique 🐢')
      expect(TaskPriorityUIService.getPriorityDescription(199)).toBe('Basique 🐢')
      expect(TaskPriorityUIService.getPriorityDescription(200)).toBe('Urgente ⚡')
      expect(TaskPriorityUIService.getPriorityDescription(299)).toBe('Urgente ⚡')
      expect(TaskPriorityUIService.getPriorityDescription(300)).toBe('Importante 📌')
      expect(TaskPriorityUIService.getPriorityDescription(399)).toBe('Importante 📌')
      expect(TaskPriorityUIService.getPriorityDescription(400)).toBe('Importante + Urgente 🔥')
      expect(TaskPriorityUIService.getPriorityDescription(499)).toBe('Importante + Urgente 🔥')
    })
  })

  describe('getComplexityDescription', () => {
    it('should return correct descriptions for complexity ranges', () => {
      expect(TaskPriorityUIService.getComplexityDescription(9)).toBe('Très complexe')
      expect(TaskPriorityUIService.getComplexityDescription(8)).toBe('Très complexe')
      expect(TaskPriorityUIService.getComplexityDescription(7)).toBe('Complexe')
      expect(TaskPriorityUIService.getComplexityDescription(6)).toBe('Complexe')
      expect(TaskPriorityUIService.getComplexityDescription(5)).toBe('Modérée')
      expect(TaskPriorityUIService.getComplexityDescription(4)).toBe('Modérée')
      expect(TaskPriorityUIService.getComplexityDescription(3)).toBe('Simple')
      expect(TaskPriorityUIService.getComplexityDescription(2)).toBe('Simple')
      expect(TaskPriorityUIService.getComplexityDescription(1)).toBe('Très simple')
      expect(TaskPriorityUIService.getComplexityDescription(0)).toBe('Très simple')
    })

    it('should handle boundary values correctly', () => {
      const boundaries = [
        { value: 7, expected: 'Complexe' },
        { value: 8, expected: 'Très complexe' },
        { value: 5, expected: 'Modérée' },
        { value: 6, expected: 'Complexe' },
        { value: 3, expected: 'Simple' },
        { value: 4, expected: 'Modérée' },
        { value: 1, expected: 'Très simple' },
        { value: 2, expected: 'Simple' }
      ]

      boundaries.forEach(({ value, expected }) => {
        expect(TaskPriorityUIService.getComplexityDescription(value)).toBe(expected)
      })
    })

    it('should handle extreme values', () => {
      expect(TaskPriorityUIService.getComplexityDescription(-1)).toBe('Très simple')
      expect(TaskPriorityUIService.getComplexityDescription(15)).toBe('Très complexe')
    })
  })

  describe('isHighPriority', () => {
    it('should identify tasks with importance >= 300 as high priority', () => {
      const highImportanceTask = createMockTaskEntity({
        importance: 300
      })

      expect(TaskPriorityUIService.isHighPriority(highImportanceTask)).toBe(true)
    })

    it('should identify critical tasks (>= 400) as high priority', () => {
      const criticalTask = createMockTaskEntity({
        importance: 400
      })

      expect(TaskPriorityUIService.isHighPriority(criticalTask)).toBe(true)
    })

    it('should not identify low importance tasks as high priority', () => {
      const lowPriorityTask = createMockTaskEntity({
        importance: 150
      })

      expect(TaskPriorityUIService.isHighPriority(lowPriorityTask)).toBe(false)
    })

    it('should handle boundary values', () => {
      const boundaryTask = createMockTaskEntity({
        importance: 300
      })

      const belowBoundaryTask = createMockTaskEntity({
        importance: 299
      })

      expect(TaskPriorityUIService.isHighPriority(boundaryTask)).toBe(true)
      expect(TaskPriorityUIService.isHighPriority(belowBoundaryTask)).toBe(false)
    })
  })

  describe('isLowPriority', () => {
    it('should identify tasks with importance < 200 as low priority', () => {
      const lowPriorityTask = createMockTaskEntity({
        importance: 150
      })

      expect(TaskPriorityUIService.isLowPriority(lowPriorityTask)).toBe(true)
    })

    it('should not identify important tasks as low priority', () => {
      const highImportanceTask = createMockTaskEntity({
        importance: 300
      })

      expect(TaskPriorityUIService.isLowPriority(highImportanceTask)).toBe(false)
    })

    it('should not identify urgent tasks as low priority', () => {
      const urgentTask = createMockTaskEntity({
        importance: 200
      })

      expect(TaskPriorityUIService.isLowPriority(urgentTask)).toBe(false)
    })
  })

  describe('getPriorityScore', () => {
    it('should return importance value clamped to 100-499', () => {
      expect(TaskPriorityUIService.getPriorityScore(createMockTaskEntity({ importance: 250 }))).toBe(250)
      expect(TaskPriorityUIService.getPriorityScore(createMockTaskEntity({ importance: 400 }))).toBe(400)
    })

    it('should clamp out-of-range values', () => {
      expect(TaskPriorityUIService.getPriorityScore(createMockTaskEntity({ importance: 50 }))).toBe(100)
      expect(TaskPriorityUIService.getPriorityScore(createMockTaskEntity({ importance: 999 }))).toBe(499)
    })
  })

  describe('sortByPriority', () => {
    it('should sort tasks by importance descending', () => {
      const tasks = [
        createMockTaskEntity({ importance: 150 }),
        createMockTaskEntity({ importance: 400 }),
        createMockTaskEntity({ importance: 250 })
      ]

      const sorted = TaskPriorityUIService.sortByPriority(tasks)

      expect(sorted[0].importance).toBe(400)
      expect(sorted[1].importance).toBe(250)
      expect(sorted[2].importance).toBe(150)
    })

    it('should sort by complexity ascending when importance is equal', () => {
      const tasks = [
        createMockTaskEntity({ importance: 300, complexity: 5 }),
        createMockTaskEntity({ importance: 300, complexity: 2 }),
        createMockTaskEntity({ importance: 300, complexity: 8 })
      ]

      const sorted = TaskPriorityUIService.sortByPriority(tasks)

      expect(sorted[0].complexity).toBe(2) // Easier tasks first
      expect(sorted[1].complexity).toBe(5)
      expect(sorted[2].complexity).toBe(8)
    })

    it('should not modify original array', () => {
      const tasks = [
        createMockTaskEntity({ importance: 150 }),
        createMockTaskEntity({ importance: 400 }),
        createMockTaskEntity({ importance: 250 })
      ]

      const originalOrder = tasks.map(t => t.importance)
      const sorted = TaskPriorityUIService.sortByPriority(tasks)

      expect(tasks.map(t => t.importance)).toEqual(originalOrder)
      expect(sorted.map(t => t.importance)).toEqual([400, 250, 150])
    })
  })

  describe('groupTasksByPriority', () => {
    it('should group tasks correctly by importance quadrants', () => {
      const tasks = [
        createMockTaskEntity({ importance: 450 }), // Critical
        createMockTaskEntity({ importance: 350 }), // High
        createMockTaskEntity({ importance: 250 }), // Medium (urgent)
        createMockTaskEntity({ importance: 150 }), // Low
        createMockTaskEntity({ importance: 100 })  // Low
      ]

      const groups = TaskPriorityUIService.groupTasksByPriority(tasks)

      expect(groups.critical.length).toBeGreaterThan(0)
      expect(groups.high.length).toBeGreaterThan(0)
      expect(groups.medium.length).toBeGreaterThan(0)
      expect(groups.low.length).toBeGreaterThan(0)
    })

    it('should handle empty task list', () => {
      const groups = TaskPriorityUIService.groupTasksByPriority([])

      expect(groups.critical).toEqual([])
      expect(groups.high).toEqual([])
      expect(groups.medium).toEqual([])
      expect(groups.low).toEqual([])
    })

    it('should group all tasks in one category if they have same priority', () => {
      const tasks = [
        createMockTaskEntity({ importance: 450 }),
        createMockTaskEntity({ importance: 420 }),
        createMockTaskEntity({ importance: 480 })
      ]

      const groups = TaskPriorityUIService.groupTasksByPriority(tasks)
      const totalTasks = groups.critical.length + groups.high.length + groups.medium.length + groups.low.length

      expect(totalTasks).toBe(tasks.length)
      expect(groups.critical.length).toBe(tasks.length) // All should be critical
    })
  })

  describe('analyzeTaskDifficulty', () => {
    it('should analyze empty task list', () => {
      const analysis = TaskPriorityUIService.analyzeTaskDifficulty([])

      expect(analysis.averageComplexity).toBe(0)
      expect(analysis.averageImportance).toBe(0)
      expect(analysis.complexityDistribution).toEqual({})
      expect(analysis.importanceDistribution).toEqual({})
    })

    it('should calculate averages correctly', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 2, importance: 100 }),
        createMockTaskEntity({ complexity: 4, importance: 200 }),
        createMockTaskEntity({ complexity: 6, importance: 300 })
      ]

      const analysis = TaskPriorityUIService.analyzeTaskDifficulty(tasks)

      expect(analysis.averageComplexity).toBe(4) // (2 + 4 + 6) / 3 = 4
      expect(analysis.averageImportance).toBe(200) // (100 + 200 + 300) / 3 = 200
    })

    it('should create distribution maps', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 2, importance: 100 }),
        createMockTaskEntity({ complexity: 2, importance: 200 }),
        createMockTaskEntity({ complexity: 4, importance: 100 })
      ]

      const analysis = TaskPriorityUIService.analyzeTaskDifficulty(tasks)

      expect(analysis.complexityDistribution[2]).toBe(2) // Two tasks with complexity 2
      expect(analysis.complexityDistribution[4]).toBe(1) // One task with complexity 4
      expect(analysis.importanceDistribution[100]).toBe(2) // Two tasks with importance 100
      expect(analysis.importanceDistribution[200]).toBe(1) // One task with importance 200
    })

    it('should round averages to one decimal place', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 1, importance: 100 }),
        createMockTaskEntity({ complexity: 2, importance: 200 })
      ]

      const analysis = TaskPriorityUIService.analyzeTaskDifficulty(tasks)

      expect(analysis.averageComplexity).toBe(1.5) // (1 + 2) / 2 = 1.5
      expect(analysis.averageImportance).toBe(150) // (100 + 200) / 2 = 150
    })
  })

  describe('integration with TaskEntity', () => {
    it('should work with real TaskEntity instances', () => {
      const testTasks = createTestTasksByCategory()

      Object.values(testTasks).forEach(task => {
        expect(TaskPriorityUIService.isHighPriority(task)).toBeDefined()
        expect(TaskPriorityUIService.isLowPriority(task)).toBeDefined()
        expect(TaskPriorityUIService.getPriorityScore(task)).toBeGreaterThanOrEqual(100)
      })
    })

    it('should provide consistent priority classification', () => {
      const task = createMockTaskEntity({
        importance: 350,
        complexity: 6
      })

      const isHigh = TaskPriorityUIService.isHighPriority(task)
      const isLow = TaskPriorityUIService.isLowPriority(task)
      const score = TaskPriorityUIService.getPriorityScore(task)

      expect(isHigh).toBe(true)
      expect(isLow).toBe(false)
      expect(score).toBe(350)
    })
  })
})
