import { describe, it, expect } from 'vitest'
import { TaskCategoryService } from '../../services/TaskCategoryService'
import { TaskCategory } from '../../entities/Task'
import { createTestTasksByCategory, createMockTaskEntity } from '../../../__tests__/utils/test-helpers'

describe('TaskCategoryService', () => {
  describe('getCategoryStyle', () => {
    it('should return correct styles for collected category', () => {
      const style = TaskCategoryService.getCategoryStyle('collected')

      expect(style.borderColor).toBe('border-l-purple-500')
      expect(style.backgroundColor).toBe('bg-white')
      expect(style.label).toBe('Collecté')
      expect(style.textColor).toBe('text-purple-700')
    })

    it('should return correct styles for overdue category', () => {
      const style = TaskCategoryService.getCategoryStyle('overdue')

      expect(style.borderColor).toBe('border-l-red-500')
      expect(style.backgroundColor).toBe('bg-red-50')
      expect(style.label).toBe('En retard')
      expect(style.textColor).toBe('text-red-700')
    })

    it('should return correct styles for today category', () => {
      const style = TaskCategoryService.getCategoryStyle('today')

      expect(style.borderColor).toBe('border-l-blue-500')
      expect(style.backgroundColor).toBe('bg-blue-50')
      expect(style.label).toBe("Aujourd'hui")
      expect(style.textColor).toBe('text-blue-700')
    })

    it('should return correct styles for tomorrow category', () => {
      const style = TaskCategoryService.getCategoryStyle('tomorrow')

      expect(style.borderColor).toBe('border-l-green-500')
      expect(style.backgroundColor).toBe('bg-green-50')
      expect(style.label).toBe('Demain')
      expect(style.textColor).toBe('text-green-700')
    })

    it('should return correct styles for no-date category', () => {
      const style = TaskCategoryService.getCategoryStyle('no-date')

      expect(style.borderColor).toBe('border-l-gray-400')
      expect(style.backgroundColor).toBe('bg-white')
      expect(style.label).toBe('Sans date')
      expect(style.textColor).toBe('text-gray-600')
    })

    it('should return correct styles for future category', () => {
      const style = TaskCategoryService.getCategoryStyle('future')

      expect(style.borderColor).toBe('border-l-amber-500')
      expect(style.backgroundColor).toBe('bg-amber-50')
      expect(style.label).toBe('Futur')
      expect(style.textColor).toBe('text-amber-700')
    })

    it('should return consistent style objects for all categories', () => {
      const categories: TaskCategory[] = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future']

      categories.forEach(category => {
        const style = TaskCategoryService.getCategoryStyle(category)

        expect(style).toHaveProperty('borderColor')
        expect(style).toHaveProperty('backgroundColor')
        expect(style).toHaveProperty('label')
        expect(style).toHaveProperty('textColor')

        expect(typeof style.borderColor).toBe('string')
        expect(typeof style.backgroundColor).toBe('string')
        expect(typeof style.label).toBe('string')
        expect(typeof style.textColor).toBe('string')

        expect(style.borderColor).toMatch(/^border-l-/)
        expect(style.backgroundColor).toMatch(/^bg-/)
        expect(style.textColor).toMatch(/^text-/)
      })
    })
  })

  describe('getCategoryPriority', () => {
    it('should return correct priority order', () => {
      expect(TaskCategoryService.getCategoryPriority('collected')).toBe(1)
      expect(TaskCategoryService.getCategoryPriority('overdue')).toBe(2)
      expect(TaskCategoryService.getCategoryPriority('today')).toBe(3)
      expect(TaskCategoryService.getCategoryPriority('tomorrow')).toBe(4)
      expect(TaskCategoryService.getCategoryPriority('no-date')).toBe(5)
      expect(TaskCategoryService.getCategoryPriority('future')).toBe(6)
    })

    it('should maintain consistent priority ordering', () => {
      const categories: TaskCategory[] = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future']
      const priorities = categories.map(cat => TaskCategoryService.getCategoryPriority(cat))

      // Check that priorities are in ascending order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i - 1])
      }
    })

    it('should return unique priorities for each category', () => {
      const categories: TaskCategory[] = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future']
      const priorities = categories.map(cat => TaskCategoryService.getCategoryPriority(cat))
      const uniquePriorities = new Set(priorities)

      expect(uniquePriorities.size).toBe(categories.length)
    })

    it('should return positive integers for all categories', () => {
      const categories: TaskCategory[] = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future']

      categories.forEach(category => {
        const priority = TaskCategoryService.getCategoryPriority(category)
        expect(priority).toBeGreaterThan(0)
        expect(Number.isInteger(priority)).toBe(true)
      })
    })
  })

  describe('groupTasksByCategory', () => {
    it('should group tasks correctly by their categories', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const groups = TaskCategoryService.groupTasksByCategory(allTasks)

      expect(groups.collected).toContain(testTasks.collected)
      expect(groups.collected).toContain(testTasks.collectedHighPriority)
      expect(groups.overdue).toContain(testTasks.overdue)
      expect(groups.today).toContain(testTasks.today)
      expect(groups.tomorrow).toContain(testTasks.tomorrow)
      expect(groups.future).toContain(testTasks.future)
      expect(groups['no-date']).toContain(testTasks.noDate)
    })

    it('should handle empty task list', () => {
      const groups = TaskCategoryService.groupTasksByCategory([])

      expect(groups.collected).toEqual([])
      expect(groups.overdue).toEqual([])
      expect(groups.today).toEqual([])
      expect(groups.tomorrow).toEqual([])
      expect(groups['no-date']).toEqual([])
      expect(groups.future).toEqual([])
    })

    it('should not lose any tasks during grouping', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const groups = TaskCategoryService.groupTasksByCategory(allTasks)
      const groupedTasksCount = Object.values(groups).reduce((sum, tasks) => sum + tasks.length, 0)

      expect(groupedTasksCount).toBe(allTasks.length)
    })

    it('should handle multiple tasks in the same category', () => {
      const todayTasks = [
        createMockTaskEntity({ name: 'Today Task 1', plannedDate: '2023-06-15T00:00:00Z' }),
        createMockTaskEntity({ name: 'Today Task 2', plannedDate: '2023-06-15T12:00:00Z' }),
        createMockTaskEntity({ name: 'Today Task 3', plannedDate: '2023-06-15T23:59:59Z' })
      ]

      const groups = TaskCategoryService.groupTasksByCategory(todayTasks)

      expect(groups.today).toHaveLength(3)
      expect(groups.today).toEqual(expect.arrayContaining(todayTasks))
    })

    it('should not modify the original task array', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)
      const originalLength = allTasks.length

      TaskCategoryService.groupTasksByCategory(allTasks)

      expect(allTasks.length).toBe(originalLength)
    })

    it('should maintain task references in groups', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const groups = TaskCategoryService.groupTasksByCategory(allTasks)

      allTasks.forEach(task => {
        const category = task.getCategory()
        expect(groups[category]).toContain(task)
      })
    })
  })

  describe('getCategoryStats', () => {
    it('should count tasks correctly in each category', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const stats = TaskCategoryService.getCategoryStats(allTasks)

      expect(stats.collected).toBe(2) // collected + collectedHighPriority
      expect(stats.overdue).toBe(1)
      expect(stats.today).toBe(1)
      expect(stats.tomorrow).toBe(1)
      expect(stats['no-date']).toBe(1)
      expect(stats.future).toBe(1)
    })

    it('should handle empty task list', () => {
      const stats = TaskCategoryService.getCategoryStats([])

      expect(stats.collected).toBe(0)
      expect(stats.overdue).toBe(0)
      expect(stats.today).toBe(0)
      expect(stats.tomorrow).toBe(0)
      expect(stats['no-date']).toBe(0)
      expect(stats.future).toBe(0)
    })

    it('should return zero for categories with no tasks', () => {
      const onlyTodayTasks = [
        createMockTaskEntity({ plannedDate: '2023-06-15T12:00:00Z' })
      ]

      const stats = TaskCategoryService.getCategoryStats(onlyTodayTasks)

      expect(stats.today).toBe(1)
      expect(stats.collected).toBe(0)
      expect(stats.overdue).toBe(0)
      expect(stats.tomorrow).toBe(0)
      expect(stats['no-date']).toBe(0)
      expect(stats.future).toBe(0)
    })

    it('should sum to total task count', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const stats = TaskCategoryService.getCategoryStats(allTasks)
      const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0)

      expect(totalCount).toBe(allTasks.length)
    })

    it('should handle large numbers of tasks', () => {
      const manyTasks = Array.from({ length: 100 }, (_, i) =>
        createMockTaskEntity({
          name: `Task ${i}`,
          plannedDate: i % 2 === 0 ? '2023-06-15T12:00:00Z' : undefined
        })
      )

      const stats = TaskCategoryService.getCategoryStats(manyTasks)
      const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0)

      expect(totalCount).toBe(100)
      expect(stats.today).toBeGreaterThan(0)
      expect(stats['no-date']).toBeGreaterThan(0)
    })
  })

  describe('filterTasksByCategory', () => {
    it('should filter tasks by specific category', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const todayTasks = TaskCategoryService.filterTasksByCategory(allTasks, 'today')

      expect(todayTasks).toHaveLength(1)
      expect(todayTasks[0]).toBe(testTasks.today)
    })

    it('should return empty array for category with no tasks', () => {
      const testTasks = [
        createMockTaskEntity({ plannedDate: '2023-06-15T12:00:00Z' }) // today
      ]

      const overdueTasks = TaskCategoryService.filterTasksByCategory(testTasks, 'overdue')

      expect(overdueTasks).toEqual([])
    })

    it('should not modify original array', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)
      const originalLength = allTasks.length

      TaskCategoryService.filterTasksByCategory(allTasks, 'today')

      expect(allTasks.length).toBe(originalLength)
    })

    it('should filter all categories correctly', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)
      const categories: TaskCategory[] = ['collected', 'overdue', 'today', 'tomorrow', 'no-date', 'future']

      categories.forEach(category => {
        const filtered = TaskCategoryService.filterTasksByCategory(allTasks, category)
        filtered.forEach(task => {
          expect(task.getCategory()).toBe(category)
        })
      })
    })

    it('should handle multiple tasks in same category', () => {
      const collectedTasks = [
        createMockTaskEntity({ importance: 0, complexity: 3, points: 0 }),
        createMockTaskEntity({ importance: 50, complexity: 1, points: 500 })
      ]

      const filtered = TaskCategoryService.filterTasksByCategory(collectedTasks, 'collected')

      expect(filtered).toHaveLength(2)
      expect(filtered).toEqual(expect.arrayContaining(collectedTasks))
    })
  })

  describe('getActiveCategories', () => {
    it('should return categories that have tasks', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const activeCategories = TaskCategoryService.getActiveCategories(allTasks)

      expect(activeCategories).toContain('collected')
      expect(activeCategories).toContain('overdue')
      expect(activeCategories).toContain('today')
      expect(activeCategories).toContain('tomorrow')
      expect(activeCategories).toContain('no-date')
      expect(activeCategories).toContain('future')
    })

    it('should not return categories without tasks', () => {
      const onlyTodayTasks = [
        createMockTaskEntity({ plannedDate: '2023-06-15T12:00:00Z' })
      ]

      const activeCategories = TaskCategoryService.getActiveCategories(onlyTodayTasks)

      expect(activeCategories).toContain('today')
      expect(activeCategories).not.toContain('collected')
      expect(activeCategories).not.toContain('overdue')
      expect(activeCategories).not.toContain('tomorrow')
      expect(activeCategories).not.toContain('no-date')
      expect(activeCategories).not.toContain('future')
    })

    it('should return empty array for empty task list', () => {
      const activeCategories = TaskCategoryService.getActiveCategories([])

      expect(activeCategories).toEqual([])
    })

    it('should return unique categories only', () => {
      const duplicateTodayTasks = [
        createMockTaskEntity({ plannedDate: '2023-06-15T12:00:00Z' }),
        createMockTaskEntity({ plannedDate: '2023-06-15T15:00:00Z' }),
        createMockTaskEntity({ plannedDate: '2023-06-15T18:00:00Z' })
      ]

      const activeCategories = TaskCategoryService.getActiveCategories(duplicateTodayTasks)

      expect(activeCategories).toEqual(['today'])
      expect(activeCategories).toHaveLength(1)
    })

    it('should maintain category order based on priority', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const activeCategories = TaskCategoryService.getActiveCategories(allTasks)

      // Should be ordered by priority (collected first, future last)
      expect(activeCategories.indexOf('collected')).toBeLessThan(activeCategories.indexOf('overdue'))
      expect(activeCategories.indexOf('overdue')).toBeLessThan(activeCategories.indexOf('today'))
      expect(activeCategories.indexOf('today')).toBeLessThan(activeCategories.indexOf('tomorrow'))
      expect(activeCategories.indexOf('tomorrow')).toBeLessThan(activeCategories.indexOf('no-date'))
      expect(activeCategories.indexOf('no-date')).toBeLessThan(activeCategories.indexOf('future'))
    })
  })

  describe('integration with TaskEntity', () => {
    it('should work correctly with TaskEntity getCategory method', () => {
      const testTasks = createTestTasksByCategory()

      Object.entries(testTasks).forEach(([expectedCategory, task]) => {
        const actualCategory = task.getCategory()

        // Map test task names to expected categories
        const categoryMap: Record<string, TaskCategory> = {
          collected: 'collected',
          collectedHighPriority: 'collected',
          overdue: 'overdue',
          today: 'today',
          tomorrow: 'tomorrow',
          future: 'future',
          noDate: 'no-date'
        }

        expect(actualCategory).toBe(categoryMap[expectedCategory])
      })
    })

    it('should provide consistent results with grouping and filtering', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const groups = TaskCategoryService.groupTasksByCategory(allTasks)

      Object.entries(groups).forEach(([category, tasksInGroup]) => {
        const filtered = TaskCategoryService.filterTasksByCategory(allTasks, category as TaskCategory)

        expect(tasksInGroup.length).toBe(filtered.length)
        expect(tasksInGroup).toEqual(expect.arrayContaining(filtered))
      })
    })

    it('should handle real-world task scenarios', () => {
      const realWorldTasks = [
        createMockTaskEntity({
          name: 'Buy groceries',
          importance: 20,
          complexity: 2,
          plannedDate: '2023-06-15T10:00:00Z'
        }),
        createMockTaskEntity({
          name: 'Finish quarterly report',
          importance: 40,
          complexity: 8,
          plannedDate: '2023-06-14T17:00:00Z' // Overdue
        }),
        createMockTaskEntity({
          name: 'Review team performance',
          importance: 35,
          complexity: 6,
          plannedDate: '2023-06-16T09:00:00Z' // Tomorrow
        }),
        createMockTaskEntity({
          name: 'Random idea for app',
          importance: 0,
          complexity: 3,
          points: 0
        })
      ]

      const groups = TaskCategoryService.groupTasksByCategory(realWorldTasks)
      const stats = TaskCategoryService.getCategoryStats(realWorldTasks)

      expect(groups.today).toHaveLength(1)
      expect(groups.overdue).toHaveLength(1)
      expect(groups.tomorrow).toHaveLength(1)
      expect(groups.collected).toHaveLength(1)

      expect(stats.today).toBe(1)
      expect(stats.overdue).toBe(1)
      expect(stats.tomorrow).toBe(1)
      expect(stats.collected).toBe(1)
    })
  })
})