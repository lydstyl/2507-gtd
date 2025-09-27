import { describe, it, expect } from 'vitest'
import {
  computePoints,
  validateImportance,
  validateComplexity,
  getDefaultTaskValues
} from '../../src/domain/utils/TaskUtils'

describe('TaskUtils', () => {
  describe('computePoints', () => {
    it('should compute points correctly with valid inputs', () => {
      expect(computePoints(50, 1)).toBe(500) // Maximum points
      expect(computePoints(25, 5)).toBe(50)  // Standard calculation
      expect(computePoints(30, 3)).toBe(100) // Round to nearest integer
      expect(computePoints(0, 5)).toBe(0)    // Zero importance
    })

    it('should handle edge cases and rounding', () => {
      expect(computePoints(1, 3)).toBe(3)    // 10 * 1 / 3 = 3.33... -> 3
      expect(computePoints(2, 3)).toBe(7)    // 10 * 2 / 3 = 6.66... -> 7
      expect(computePoints(7, 3)).toBe(23)   // 10 * 7 / 3 = 23.33... -> 23
      expect(computePoints(8, 3)).toBe(27)   // 10 * 8 / 3 = 26.66... -> 27
    })

    it('should clamp points to maximum value of 500', () => {
      expect(computePoints(100, 1)).toBe(500) // Would be 1000, clamped to 500
      expect(computePoints(75, 1)).toBe(500)  // Would be 750, clamped to 500
      expect(computePoints(50, 1)).toBe(500)  // Exactly 500
    })

    it('should clamp points to minimum value of 0', () => {
      expect(computePoints(0, 1)).toBe(0)
      expect(computePoints(0, 9)).toBe(0)
    })

    it('should sanitize invalid importance values', () => {
      expect(computePoints(-10, 5)).toBe(0)   // Negative importance -> 0
      expect(computePoints(100, 5)).toBe(100) // Over max importance -> 50 -> 10 * 50 / 5 = 100
      expect(computePoints(60, 5)).toBe(100)  // Over max importance -> 50 -> 10 * 50 / 5 = 100
    })

    it('should sanitize invalid complexity values', () => {
      expect(computePoints(25, 0)).toBe(250)  // Zero complexity -> 1 -> 250
      expect(computePoints(25, -5)).toBe(250) // Negative complexity -> 1 -> 250
      expect(computePoints(25, 15)).toBe(28)  // Over max complexity -> 9 -> 28
      expect(computePoints(25, 10)).toBe(28)  // Over max complexity -> 9 -> 28
    })

    it('should handle decimal inputs by using valid ranges', () => {
      expect(computePoints(25.7, 5.2)).toBe(49) // Math.round(10 * 25.7 / 5.2) = 49
      expect(computePoints(30.9, 2.1)).toBe(147) // Math.round(10 * 30.9 / 2.1) = 147
    })

    it('should handle boundary values correctly', () => {
      // Boundary importance values
      expect(computePoints(0, 5)).toBe(0)
      expect(computePoints(50, 5)).toBe(100)

      // Boundary complexity values
      expect(computePoints(25, 1)).toBe(250)
      expect(computePoints(25, 9)).toBe(28)

      // Corner cases
      expect(computePoints(50, 9)).toBe(56)  // Minimum points for max importance
      expect(computePoints(1, 1)).toBe(10)   // Minimum practical points
    })

    it('should produce consistent results', () => {
      // Same inputs should always produce same outputs
      const inputs = [
        [25, 5],
        [30, 3],
        [45, 9],
        [10, 2]
      ]

      inputs.forEach(([importance, complexity]) => {
        const result1 = computePoints(importance, complexity)
        const result2 = computePoints(importance, complexity)
        expect(result1).toBe(result2)
      })
    })
  })

  describe('validateImportance', () => {
    it('should accept valid importance values', () => {
      expect(validateImportance(0)).toBe(true)
      expect(validateImportance(25)).toBe(true)
      expect(validateImportance(50)).toBe(true)
      expect(validateImportance(1)).toBe(true)
      expect(validateImportance(49)).toBe(true)
    })

    it('should reject invalid importance values', () => {
      expect(validateImportance(-1)).toBe(false)
      expect(validateImportance(51)).toBe(false)
      expect(validateImportance(100)).toBe(false)
      expect(validateImportance(-10)).toBe(false)
    })

    it('should reject non-integer values', () => {
      expect(validateImportance(25.5)).toBe(false)
      expect(validateImportance(0.1)).toBe(false)
      expect(validateImportance(49.9)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      expect(validateImportance(NaN)).toBe(false)
      expect(validateImportance(Infinity)).toBe(false)
      expect(validateImportance(-Infinity)).toBe(false)
    })

    it('should handle edge cases', () => {
      // Test boundary values
      expect(validateImportance(0)).toBe(true)   // Lower boundary
      expect(validateImportance(50)).toBe(true)  // Upper boundary
      expect(validateImportance(-0)).toBe(true)  // Negative zero
    })
  })

  describe('validateComplexity', () => {
    it('should accept valid complexity values', () => {
      expect(validateComplexity(1)).toBe(true)
      expect(validateComplexity(5)).toBe(true)
      expect(validateComplexity(9)).toBe(true)
      expect(validateComplexity(2)).toBe(true)
      expect(validateComplexity(8)).toBe(true)
    })

    it('should reject invalid complexity values', () => {
      expect(validateComplexity(0)).toBe(false)
      expect(validateComplexity(10)).toBe(false)
      expect(validateComplexity(-1)).toBe(false)
      expect(validateComplexity(15)).toBe(false)
    })

    it('should reject non-integer values', () => {
      expect(validateComplexity(5.5)).toBe(false)
      expect(validateComplexity(1.1)).toBe(false)
      expect(validateComplexity(8.9)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      expect(validateComplexity(NaN)).toBe(false)
      expect(validateComplexity(Infinity)).toBe(false)
      expect(validateComplexity(-Infinity)).toBe(false)
    })

    it('should handle edge cases', () => {
      // Test boundary values
      expect(validateComplexity(1)).toBe(true)  // Lower boundary
      expect(validateComplexity(9)).toBe(true)  // Upper boundary
    })
  })

  describe('getDefaultTaskValues', () => {
    it('should return consistent default values', () => {
      const defaults1 = getDefaultTaskValues()
      const defaults2 = getDefaultTaskValues()

      expect(defaults1).toEqual(defaults2)
    })

    it('should return maximum priority values', () => {
      const defaults = getDefaultTaskValues()

      expect(defaults.importance).toBe(50)  // Maximum importance
      expect(defaults.complexity).toBe(1)   // Minimum complexity
      expect(defaults.points).toBe(500)     // Maximum points
    })

    it('should return values that pass validation', () => {
      const defaults = getDefaultTaskValues()

      expect(validateImportance(defaults.importance)).toBe(true)
      expect(validateComplexity(defaults.complexity)).toBe(true)
      expect(defaults.points).toBeGreaterThanOrEqual(0)
      expect(defaults.points).toBeLessThanOrEqual(500)
    })

    it('should return points that match the calculation formula', () => {
      const defaults = getDefaultTaskValues()
      const calculatedPoints = computePoints(defaults.importance, defaults.complexity)

      expect(defaults.points).toBe(calculatedPoints)
    })

    it('should return an object with all required properties', () => {
      const defaults = getDefaultTaskValues()

      expect(defaults).toHaveProperty('importance')
      expect(defaults).toHaveProperty('complexity')
      expect(defaults).toHaveProperty('points')

      expect(typeof defaults.importance).toBe('number')
      expect(typeof defaults.complexity).toBe('number')
      expect(typeof defaults.points).toBe('number')
    })

    it('should return immutable values', () => {
      const defaults1 = getDefaultTaskValues()
      const defaults2 = getDefaultTaskValues()

      // Modifying one shouldn't affect the other
      defaults1.importance = 10
      expect(defaults2.importance).toBe(50)
    })
  })

  describe('integration tests', () => {
    it('should work correctly with computed points and validation', () => {
      const { importance, complexity } = getDefaultTaskValues()

      expect(validateImportance(importance)).toBe(true)
      expect(validateComplexity(complexity)).toBe(true)

      const points = computePoints(importance, complexity)
      expect(points).toBe(500)
    })

    it('should handle the full range of valid combinations', () => {
      // Test various valid combinations
      const validCombinations = [
        [0, 1],   // Minimum importance, minimum complexity
        [50, 1],  // Maximum importance, minimum complexity
        [0, 9],   // Minimum importance, maximum complexity
        [50, 9],  // Maximum importance, maximum complexity
        [25, 5],  // Middle values
      ]

      validCombinations.forEach(([importance, complexity]) => {
        expect(validateImportance(importance)).toBe(true)
        expect(validateComplexity(complexity)).toBe(true)

        const points = computePoints(importance, complexity)
        expect(points).toBeGreaterThanOrEqual(0)
        expect(points).toBeLessThanOrEqual(500)
      })
    })

    it('should handle edge cases in the business logic', () => {
      // Test that business rules are consistent
      expect(computePoints(50, 1)).toBe(500)  // Highest priority
      expect(computePoints(0, 9)).toBe(0)     // Lowest priority
      expect(computePoints(45, 1)).toBe(450)  // High priority
      expect(computePoints(5, 9)).toBe(6)     // Low priority
    })
  })
})