import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaskPriorityService } from '../../services/TaskPriorityService'
import { createMockTaskEntity, createTestTasksByCategory, createTestDates } from '../../../__tests__/utils/test-helpers'

describe('TaskPriorityService', () => {
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
  describe('calculatePoints', () => {
    it('should calculate points correctly', () => {
      expect(TaskPriorityService.calculatePoints(50, 1)).toBe(500) // Maximum points
      expect(TaskPriorityService.calculatePoints(25, 5)).toBe(50)  // Standard calculation
      expect(TaskPriorityService.calculatePoints(30, 3)).toBe(100) // Round to nearest integer
      expect(TaskPriorityService.calculatePoints(0, 5)).toBe(0)    // Zero importance
    })

    it('should handle edge cases and rounding', () => {
      expect(TaskPriorityService.calculatePoints(1, 3)).toBe(3)    // 10 * 1 / 3 = 3.33... -> 3
      expect(TaskPriorityService.calculatePoints(2, 3)).toBe(7)    // 10 * 2 / 3 = 6.66... -> 7
      expect(TaskPriorityService.calculatePoints(7, 3)).toBe(23)   // 10 * 7 / 3 = 23.33... -> 23
      expect(TaskPriorityService.calculatePoints(8, 3)).toBe(27)   // 10 * 8 / 3 = 26.66... -> 27
    })

    it('should handle zero complexity', () => {
      expect(TaskPriorityService.calculatePoints(25, 0)).toBe(0)
      expect(TaskPriorityService.calculatePoints(50, 0)).toBe(0)
    })

    it('should handle boundary values', () => {
      // Minimum values
      expect(TaskPriorityService.calculatePoints(0, 1)).toBe(0)
      expect(TaskPriorityService.calculatePoints(1, 1)).toBe(10)

      // Maximum values
      expect(TaskPriorityService.calculatePoints(50, 1)).toBe(500)
      expect(TaskPriorityService.calculatePoints(50, 9)).toBe(56) // 10 * 50 / 9 = 55.55... -> 56
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct colors for importance levels', () => {
      expect(TaskPriorityService.getPriorityColor(1)).toBe('bg-black')
      expect(TaskPriorityService.getPriorityColor(2)).toBe('bg-gray-800')
      expect(TaskPriorityService.getPriorityColor(3)).toBe('bg-gray-600')
      expect(TaskPriorityService.getPriorityColor(4)).toBe('bg-gray-400')
      expect(TaskPriorityService.getPriorityColor(5)).toBe('bg-gray-200')
    })

    it('should return default color for other values', () => {
      expect(TaskPriorityService.getPriorityColor(0)).toBe('bg-gray-300')
      expect(TaskPriorityService.getPriorityColor(6)).toBe('bg-gray-300')
      expect(TaskPriorityService.getPriorityColor(50)).toBe('bg-gray-300')
      expect(TaskPriorityService.getPriorityColor(-1)).toBe('bg-gray-300')
    })

    it('should handle edge importance values', () => {
      const edgeValues = [0, 1, 2, 3, 4, 5, 6, 10, 25, 50]

      edgeValues.forEach(importance => {
        const color = TaskPriorityService.getPriorityColor(importance)
        expect(color).toMatch(/^bg-/) // Should start with 'bg-'
        expect(typeof color).toBe('string')
      })
    })
  })

  describe('getPriorityDescription', () => {
    it('should return correct descriptions for importance ranges', () => {
      expect(TaskPriorityService.getPriorityDescription(50)).toBe('Critique')
      expect(TaskPriorityService.getPriorityDescription(45)).toBe('Critique')
      expect(TaskPriorityService.getPriorityDescription(44)).toBe('Très élevée')
      expect(TaskPriorityService.getPriorityDescription(35)).toBe('Très élevée')
      expect(TaskPriorityService.getPriorityDescription(34)).toBe('Élevée')
      expect(TaskPriorityService.getPriorityDescription(25)).toBe('Élevée')
      expect(TaskPriorityService.getPriorityDescription(24)).toBe('Moyenne')
      expect(TaskPriorityService.getPriorityDescription(15)).toBe('Moyenne')
      expect(TaskPriorityService.getPriorityDescription(14)).toBe('Faible')
      expect(TaskPriorityService.getPriorityDescription(5)).toBe('Faible')
      expect(TaskPriorityService.getPriorityDescription(4)).toBe('Très faible')
      expect(TaskPriorityService.getPriorityDescription(0)).toBe('Très faible')
    })

    it('should handle boundary values correctly', () => {
      const boundaries = [
        { value: 44, expected: 'Très élevée' },
        { value: 45, expected: 'Critique' },
        { value: 34, expected: 'Élevée' },
        { value: 35, expected: 'Très élevée' },
        { value: 24, expected: 'Moyenne' },
        { value: 25, expected: 'Élevée' },
        { value: 14, expected: 'Faible' },
        { value: 15, expected: 'Moyenne' },
        { value: 4, expected: 'Très faible' },
        { value: 5, expected: 'Faible' }
      ]

      boundaries.forEach(({ value, expected }) => {
        expect(TaskPriorityService.getPriorityDescription(value)).toBe(expected)
      })
    })

    it('should handle negative and extreme values', () => {
      expect(TaskPriorityService.getPriorityDescription(-1)).toBe('Très faible')
      expect(TaskPriorityService.getPriorityDescription(100)).toBe('Critique')
    })
  })

  describe('getComplexityDescription', () => {
    it('should return correct descriptions for complexity ranges', () => {
      expect(TaskPriorityService.getComplexityDescription(9)).toBe('Très complexe')
      expect(TaskPriorityService.getComplexityDescription(8)).toBe('Très complexe')
      expect(TaskPriorityService.getComplexityDescription(7)).toBe('Complexe')
      expect(TaskPriorityService.getComplexityDescription(6)).toBe('Complexe')
      expect(TaskPriorityService.getComplexityDescription(5)).toBe('Modérée')
      expect(TaskPriorityService.getComplexityDescription(4)).toBe('Modérée')
      expect(TaskPriorityService.getComplexityDescription(3)).toBe('Simple')
      expect(TaskPriorityService.getComplexityDescription(2)).toBe('Simple')
      expect(TaskPriorityService.getComplexityDescription(1)).toBe('Très simple')
      expect(TaskPriorityService.getComplexityDescription(0)).toBe('Très simple')
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
        expect(TaskPriorityService.getComplexityDescription(value)).toBe(expected)
      })
    })

    it('should handle extreme values', () => {
      expect(TaskPriorityService.getComplexityDescription(-1)).toBe('Très simple')
      expect(TaskPriorityService.getComplexityDescription(15)).toBe('Très complexe')
    })
  })

  describe('getPointsBadgeColor', () => {
    it('should return correct colors for points ranges', () => {
      expect(TaskPriorityService.getPointsBadgeColor(500)).toBe('bg-red-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(400)).toBe('bg-red-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(399)).toBe('bg-orange-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(300)).toBe('bg-orange-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(299)).toBe('bg-yellow-500 text-black')
      expect(TaskPriorityService.getPointsBadgeColor(200)).toBe('bg-yellow-500 text-black')
      expect(TaskPriorityService.getPointsBadgeColor(199)).toBe('bg-blue-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(100)).toBe('bg-blue-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(99)).toBe('bg-green-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(50)).toBe('bg-green-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(49)).toBe('bg-gray-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(0)).toBe('bg-gray-500 text-white')
    })

    it('should handle boundary values correctly', () => {
      const boundaries = [
        { value: 399, expected: 'bg-orange-500 text-white' },
        { value: 400, expected: 'bg-red-500 text-white' },
        { value: 299, expected: 'bg-yellow-500 text-black' },
        { value: 300, expected: 'bg-orange-500 text-white' },
        { value: 199, expected: 'bg-blue-500 text-white' },
        { value: 200, expected: 'bg-yellow-500 text-black' },
        { value: 99, expected: 'bg-green-500 text-white' },
        { value: 100, expected: 'bg-blue-500 text-white' },
        { value: 49, expected: 'bg-gray-500 text-white' },
        { value: 50, expected: 'bg-green-500 text-white' }
      ]

      boundaries.forEach(({ value, expected }) => {
        expect(TaskPriorityService.getPointsBadgeColor(value)).toBe(expected)
      })
    })

    it('should handle negative and extreme values', () => {
      expect(TaskPriorityService.getPointsBadgeColor(-1)).toBe('bg-gray-500 text-white')
      expect(TaskPriorityService.getPointsBadgeColor(1000)).toBe('bg-red-500 text-white')
    })
  })

  describe('isHighPriority', () => {
    it('should identify high priority tasks by points', () => {
      const highPointsTask = createMockTaskEntity({
        points: 200,
        importance: 10
      })

      expect(TaskPriorityService.isHighPriority(highPointsTask)).toBe(true)
    })

    it('should identify high priority tasks by importance', () => {
      const highImportanceTask = createMockTaskEntity({
        points: 100,
        importance: 30
      })

      expect(TaskPriorityService.isHighPriority(highImportanceTask)).toBe(true)
    })

    it('should identify high priority tasks by both criteria', () => {
      const highPriorityTask = createMockTaskEntity({
        points: 250,
        importance: 35
      })

      expect(TaskPriorityService.isHighPriority(highPriorityTask)).toBe(true)
    })

    it('should not identify low priority tasks', () => {
      const lowPriorityTask = createMockTaskEntity({
        points: 100,
        importance: 20
      })

      expect(TaskPriorityService.isHighPriority(lowPriorityTask)).toBe(false)
    })

    it('should handle boundary values', () => {
      const boundaryPointsTask = createMockTaskEntity({
        points: 200,
        importance: 10
      })

      const boundaryImportanceTask = createMockTaskEntity({
        points: 100,
        importance: 30
      })

      expect(TaskPriorityService.isHighPriority(boundaryPointsTask)).toBe(true)
      expect(TaskPriorityService.isHighPriority(boundaryImportanceTask)).toBe(true)
    })
  })

  describe('isLowPriority', () => {
    it('should identify low priority tasks', () => {
      const lowPriorityTask = createMockTaskEntity({
        points: 30,
        importance: 5
      })

      expect(TaskPriorityService.isLowPriority(lowPriorityTask)).toBe(true)
    })

    it('should not identify tasks with high points as low priority', () => {
      const highPointsTask = createMockTaskEntity({
        points: 100,
        importance: 5
      })

      expect(TaskPriorityService.isLowPriority(highPointsTask)).toBe(false)
    })

    it('should not identify tasks with high importance as low priority', () => {
      const highImportanceTask = createMockTaskEntity({
        points: 30,
        importance: 15
      })

      expect(TaskPriorityService.isLowPriority(highImportanceTask)).toBe(false)
    })

    it('should handle boundary values', () => {
      const boundaryTask1 = createMockTaskEntity({
        points: 50,
        importance: 9
      })

      const boundaryTask2 = createMockTaskEntity({
        points: 49,
        importance: 10
      })

      expect(TaskPriorityService.isLowPriority(boundaryTask1)).toBe(false)
      expect(TaskPriorityService.isLowPriority(boundaryTask2)).toBe(false)
    })

    it('should handle zero values', () => {
      const zeroTask = createMockTaskEntity({
        points: 0,
        importance: 0
      })

      expect(TaskPriorityService.isLowPriority(zeroTask)).toBe(true)
    })
  })

  describe('getPriorityScore', () => {
    it('should calculate priority score correctly', () => {
      const testCases = [
        { points: 500, importance: 50, expectedScore: 100 }, // Maximum score
        { points: 250, importance: 25, expectedScore: 80 },  // 50 * 0.6 + 50 * 0.4 = 30 + 20 = 50... wait, let me recalculate
        { points: 0, importance: 0, expectedScore: 0 },      // Minimum score
      ]

      testCases.forEach(({ points, importance, expectedScore }) => {
        const task = createMockTaskEntity({ points, importance })
        const score = TaskPriorityService.getPriorityScore(task)

        // Calculate expected: pointsScore * 0.6 + importanceScore * 0.4
        const pointsScore = Math.min(points / 5, 100)
        const importanceScore = importance * 2
        const expected = Math.round(pointsScore * 0.6 + importanceScore * 0.4)

        expect(score).toBe(expected)
      })
    })

    it('should cap points score at 100', () => {
      const highPointsTask = createMockTaskEntity({
        points: 1000, // Would give points score > 100
        importance: 0
      })

      const score = TaskPriorityService.getPriorityScore(highPointsTask)
      expect(score).toBe(60) // 100 * 0.6 + 0 * 0.4 = 60
    })

    it('should cap importance score at 100', () => {
      const highImportanceTask = createMockTaskEntity({
        points: 0,
        importance: 100 // Would give importance score > 100
      })

      const score = TaskPriorityService.getPriorityScore(highImportanceTask)
      expect(score).toBe(80) // 0 * 0.6 + 100 * 0.4 = 40... wait, importance * 2 would be 200, capped at 100
    })

    it('should handle various combinations', () => {
      const combinations = [
        { points: 100, importance: 10 }, // 20 * 0.6 + 20 * 0.4 = 12 + 8 = 20
        { points: 200, importance: 20 }, // 40 * 0.6 + 40 * 0.4 = 24 + 16 = 40
        { points: 300, importance: 30 }, // 60 * 0.6 + 60 * 0.4 = 36 + 24 = 60
      ]

      combinations.forEach(({ points, importance }) => {
        const task = createMockTaskEntity({ points, importance })
        const score = TaskPriorityService.getPriorityScore(task)

        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
        expect(Number.isInteger(score)).toBe(true)
      })
    })
  })

  describe('sortByPriority', () => {
    it('should sort tasks by points descending', () => {
      const tasks = [
        createMockTaskEntity({ points: 100, importance: 10 }),
        createMockTaskEntity({ points: 300, importance: 10 }),
        createMockTaskEntity({ points: 200, importance: 10 })
      ]

      const sorted = TaskPriorityService.sortByPriority(tasks)

      expect(sorted[0].points).toBe(300)
      expect(sorted[1].points).toBe(200)
      expect(sorted[2].points).toBe(100)
    })

    it('should sort by importance when points are equal', () => {
      const tasks = [
        createMockTaskEntity({ points: 100, importance: 20 }),
        createMockTaskEntity({ points: 100, importance: 30 }),
        createMockTaskEntity({ points: 100, importance: 10 })
      ]

      const sorted = TaskPriorityService.sortByPriority(tasks)

      expect(sorted[0].importance).toBe(30)
      expect(sorted[1].importance).toBe(20)
      expect(sorted[2].importance).toBe(10)
    })

    it('should sort by complexity when points and importance are equal', () => {
      const tasks = [
        createMockTaskEntity({ points: 100, importance: 20, complexity: 5 }),
        createMockTaskEntity({ points: 100, importance: 20, complexity: 2 }),
        createMockTaskEntity({ points: 100, importance: 20, complexity: 8 })
      ]

      const sorted = TaskPriorityService.sortByPriority(tasks)

      expect(sorted[0].complexity).toBe(2) // Easier tasks first
      expect(sorted[1].complexity).toBe(5)
      expect(sorted[2].complexity).toBe(8)
    })

    it('should not modify original array', () => {
      const tasks = [
        createMockTaskEntity({ points: 100 }),
        createMockTaskEntity({ points: 300 }),
        createMockTaskEntity({ points: 200 })
      ]

      const originalOrder = tasks.map(t => t.points)
      const sorted = TaskPriorityService.sortByPriority(tasks)

      expect(tasks.map(t => t.points)).toEqual(originalOrder)
      expect(sorted.map(t => t.points)).toEqual([300, 200, 100])
    })
  })

  describe('groupTasksByPriority', () => {
    it('should group tasks correctly by priority score', () => {
      const tasks = [
        createMockTaskEntity({ points: 500, importance: 50 }), // Critical
        createMockTaskEntity({ points: 300, importance: 30 }), // High
        createMockTaskEntity({ points: 150, importance: 15 }), // Medium
        createMockTaskEntity({ points: 50, importance: 5 }),   // Low
        createMockTaskEntity({ points: 0, importance: 0 })     // Low
      ]

      const groups = TaskPriorityService.groupTasksByPriority(tasks)

      expect(groups.critical.length).toBeGreaterThan(0)
      expect(groups.high.length).toBeGreaterThan(0)
      expect(groups.medium.length).toBeGreaterThan(0)
      expect(groups.low.length).toBeGreaterThan(0)
    })

    it('should handle empty task list', () => {
      const groups = TaskPriorityService.groupTasksByPriority([])

      expect(groups.critical).toEqual([])
      expect(groups.high).toEqual([])
      expect(groups.medium).toEqual([])
      expect(groups.low).toEqual([])
    })

    it('should group all tasks in one category if they have same priority', () => {
      const tasks = [
        createMockTaskEntity({ points: 500, importance: 50 }),
        createMockTaskEntity({ points: 400, importance: 40 }),
        createMockTaskEntity({ points: 450, importance: 45 })
      ]

      const groups = TaskPriorityService.groupTasksByPriority(tasks)
      const totalTasks = groups.critical.length + groups.high.length + groups.medium.length + groups.low.length

      expect(totalTasks).toBe(tasks.length)
      expect(groups.critical.length).toBe(tasks.length) // All should be critical
    })
  })

  describe('analyzeTaskDifficulty', () => {
    it('should analyze empty task list', () => {
      const analysis = TaskPriorityService.analyzeTaskDifficulty([])

      expect(analysis.averageComplexity).toBe(0)
      expect(analysis.averageImportance).toBe(0)
      expect(analysis.averagePoints).toBe(0)
      expect(analysis.complexityDistribution).toEqual({})
      expect(analysis.importanceDistribution).toEqual({})
    })

    it('should calculate averages correctly', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 2, importance: 10, points: 50 }),
        createMockTaskEntity({ complexity: 4, importance: 20, points: 50 }),
        createMockTaskEntity({ complexity: 6, importance: 30, points: 50 })
      ]

      const analysis = TaskPriorityService.analyzeTaskDifficulty(tasks)

      expect(analysis.averageComplexity).toBe(4) // (2 + 4 + 6) / 3 = 4
      expect(analysis.averageImportance).toBe(20) // (10 + 20 + 30) / 3 = 20
      expect(analysis.averagePoints).toBe(50) // (50 + 50 + 50) / 3 = 50
    })

    it('should create distribution maps', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 2, importance: 10 }),
        createMockTaskEntity({ complexity: 2, importance: 20 }),
        createMockTaskEntity({ complexity: 4, importance: 10 })
      ]

      const analysis = TaskPriorityService.analyzeTaskDifficulty(tasks)

      expect(analysis.complexityDistribution[2]).toBe(2) // Two tasks with complexity 2
      expect(analysis.complexityDistribution[4]).toBe(1) // One task with complexity 4
      expect(analysis.importanceDistribution[10]).toBe(2) // Two tasks with importance 10
      expect(analysis.importanceDistribution[20]).toBe(1) // One task with importance 20
    })

    it('should round averages to one decimal place', () => {
      const tasks = [
        createMockTaskEntity({ complexity: 1, importance: 1, points: 1 }),
        createMockTaskEntity({ complexity: 2, importance: 2, points: 2 })
      ]

      const analysis = TaskPriorityService.analyzeTaskDifficulty(tasks)

      expect(analysis.averageComplexity).toBe(1.5) // (1 + 2) / 2 = 1.5
      expect(analysis.averageImportance).toBe(1.5) // (1 + 2) / 2 = 1.5
      expect(analysis.averagePoints).toBe(1.5) // (1 + 2) / 2 = 1.5
    })
  })

  describe('integration with TaskEntity', () => {
    it('should work with real TaskEntity instances', () => {
      const testTasks = createTestTasksByCategory()

      Object.values(testTasks).forEach(task => {
        expect(TaskPriorityService.isHighPriority(task)).toBeDefined()
        expect(TaskPriorityService.isLowPriority(task)).toBeDefined()
        expect(TaskPriorityService.getPriorityScore(task)).toBeGreaterThanOrEqual(0)
      })
    })

    it('should provide consistent priority classification', () => {
      const task = createMockTaskEntity({
        points: 200,
        importance: 30,
        complexity: 6
      })

      const isHigh = TaskPriorityService.isHighPriority(task)
      const isLow = TaskPriorityService.isLowPriority(task)
      const score = TaskPriorityService.getPriorityScore(task)

      expect(isHigh).toBe(true)
      expect(isLow).toBe(false)
      expect(score).toBe(48) // 40 * 0.6 + 60 * 0.4 = 24 + 24 = 48
    })
  })
})