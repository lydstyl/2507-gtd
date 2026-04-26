import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TaskCategoryService } from '../../services/TaskCategoryService'
import { TaskCategory, TaskEntity } from '../../entities/Task'
import { createTestTasksByCategory, createMockTaskEntity, createTestDates } from '../../../__tests__/utils/test-helpers'

describe('TaskCategoryService', () => {
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
  describe('getCategoryStyle', () => {
    it('should return correct styles for collected category', () => {
      const style = TaskCategoryService.getCategoryStyle('collected')

      expect(style.borderColor).toBe('border-l-purple-500')
      expect(style.backgroundColor).toBe('bg-white')
      expect(style.label).toBe('Collecté')
      expect(style.textColor).toBe('text-purple-700')
    })

    it('should return correct styles for pret-overdue category', () => {
      const style = TaskCategoryService.getCategoryStyle('pret-overdue')

      expect(style.borderColor).toBe('border-l-red-500')
      expect(style.backgroundColor).toBe('bg-red-50')
      expect(style.label).toBe('En retard')
      expect(style.textColor).toBe('text-red-700')
    })

    it('should return correct styles for pret-today category', () => {
      const style = TaskCategoryService.getCategoryStyle('pret-today')

      expect(style.borderColor).toBe('border-l-blue-500')
      expect(style.backgroundColor).toBe('bg-blue-50')
      expect(style.label).toBe("Aujourd'hui")
      expect(style.textColor).toBe('text-blue-700')
    })

    it('should return correct styles for pret-tomorrow category', () => {
      const style = TaskCategoryService.getCategoryStyle('pret-tomorrow')

      expect(style.borderColor).toBe('border-l-green-500')
      expect(style.backgroundColor).toBe('bg-green-50')
      expect(style.label).toBe('Demain')
      expect(style.textColor).toBe('text-green-700')
    })

    it('should return correct styles for pret-no-date category', () => {
      const style = TaskCategoryService.getCategoryStyle('pret-no-date')

      expect(style.borderColor).toBe('border-l-gray-400')
      expect(style.backgroundColor).toBe('bg-white')
      expect(style.label).toBe('Sans date')
      expect(style.textColor).toBe('text-gray-600')
    })

    it('should return correct styles for pret-future category', () => {
      const style = TaskCategoryService.getCategoryStyle('pret-future')

      expect(style.borderColor).toBe('border-l-amber-500')
      expect(style.backgroundColor).toBe('bg-amber-50')
      expect(style.label).toBe('Futur')
      expect(style.textColor).toBe('text-amber-700')
    })

    it('should return consistent style objects for all categories', () => {
      const categories: TaskCategory[] = ['brouillon', 'pour-ia', 'collected', 'pret-overdue', 'pret-today', 'pret-tomorrow', 'pret-no-date', 'pret-future', 'un-jour']

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
      expect(TaskCategoryService.getCategoryPriority('brouillon')).toBe(1)
      expect(TaskCategoryService.getCategoryPriority('pour-ia')).toBe(2)
      expect(TaskCategoryService.getCategoryPriority('collected')).toBe(3)
      expect(TaskCategoryService.getCategoryPriority('pret-overdue')).toBe(4)
      expect(TaskCategoryService.getCategoryPriority('pret-today')).toBe(5)
      expect(TaskCategoryService.getCategoryPriority('pret-tomorrow')).toBe(6)
      expect(TaskCategoryService.getCategoryPriority('pret-no-date')).toBe(7)
      expect(TaskCategoryService.getCategoryPriority('pret-future')).toBe(8)
      expect(TaskCategoryService.getCategoryPriority('un-jour')).toBe(9)
    })

    it('should maintain consistent priority ordering', () => {
      const categories: TaskCategory[] = ['brouillon', 'pour-ia', 'collected', 'pret-overdue', 'pret-today', 'pret-tomorrow', 'pret-no-date', 'pret-future', 'un-jour']
      const priorities = categories.map(cat => TaskCategoryService.getCategoryPriority(cat))

      // Check that priorities are in ascending order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i - 1])
      }
    })

    it('should return unique priorities for each category', () => {
      const categories: TaskCategory[] = ['brouillon', 'pour-ia', 'collected', 'pret-overdue', 'pret-today', 'pret-tomorrow', 'pret-no-date', 'pret-future', 'un-jour']
      const priorities = categories.map(cat => TaskCategoryService.getCategoryPriority(cat))
      const uniquePriorities = new Set(priorities)

      expect(uniquePriorities.size).toBe(categories.length)
    })

    it('should return positive integers for all categories', () => {
      const categories: TaskCategory[] = ['brouillon', 'pour-ia', 'collected', 'pret-overdue', 'pret-today', 'pret-tomorrow', 'pret-no-date', 'pret-future', 'un-jour']

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
      const allTasks = Object.values(testTasks).map(t => t.rawTask)

      const groups = TaskCategoryService.groupTasksByCategory(allTasks)

      expect(groups.collected).toContain(testTasks.collected.rawTask)
      expect(groups['pret-no-date']).toContain(testTasks.highPriorityNoDate.rawTask)
      expect(groups['pret-overdue']).toContain(testTasks.overdue.rawTask)
      expect(groups['pret-today']).toContain(testTasks.today.rawTask)
      expect(groups['pret-tomorrow']).toContain(testTasks.tomorrow.rawTask)
      expect(groups['pret-future']).toContain(testTasks.future.rawTask)
      expect(groups['pret-no-date']).toContain(testTasks.noDate.rawTask)
    })

    it('should handle empty task list', () => {
      const groups = TaskCategoryService.groupTasksByCategory([])

      expect(groups.collected).toEqual([])
      expect(groups['pret-overdue']).toEqual([])
      expect(groups['pret-today']).toEqual([])
      expect(groups['pret-tomorrow']).toEqual([])
      expect(groups['pret-no-date']).toEqual([])
      expect(groups['pret-future']).toEqual([])
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
        createMockTaskEntity({ name: 'Today Task 1', status: 'pret', plannedDate: '2023-06-15T00:00:00Z' }),
        createMockTaskEntity({ name: 'Today Task 2', status: 'pret', plannedDate: '2023-06-15T12:00:00Z' }),
        createMockTaskEntity({ name: 'Today Task 3', status: 'pret', plannedDate: '2023-06-15T23:59:59Z' })
      ]

      const groups = TaskCategoryService.groupTasksByCategory(todayTasks)

      expect(groups['pret-today']).toHaveLength(3)
      expect(groups['pret-today']).toEqual(expect.arrayContaining(todayTasks))
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
      const allTasks = Object.values(testTasks).map(t => t.rawTask)

      const groups = TaskCategoryService.groupTasksByCategory(allTasks)

      allTasks.forEach(task => {
        const category = new TaskEntity(task).getCategory()
        expect(groups[category]).toContain(task)
      })
    })
  })

  describe('getCategoryStats', () => {
    it('should count tasks correctly in each category', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks).map(t => t.rawTask)

      const stats = TaskCategoryService.getCategoryStats(allTasks)

      expect(stats.collected).toBe(1) // only collected (default task)
      expect(stats['pret-overdue']).toBe(1)
      expect(stats['pret-today']).toBe(1)
      expect(stats['pret-tomorrow']).toBe(1)
      expect(stats['pret-no-date']).toBe(2) // noDate + highPriorityNoDate
      expect(stats['pret-future']).toBe(1)
    })

    it('should handle empty task list', () => {
      const stats = TaskCategoryService.getCategoryStats([])

      expect(stats.collected).toBe(0)
      expect(stats['pret-overdue']).toBe(0)
      expect(stats['pret-today']).toBe(0)
      expect(stats['pret-tomorrow']).toBe(0)
      expect(stats['pret-no-date']).toBe(0)
      expect(stats['pret-future']).toBe(0)
    })

    it('should return zero for categories with no tasks', () => {
      const onlyTodayTasks = [
        createMockTaskEntity({ status: 'pret', plannedDate: '2023-06-15T12:00:00Z' })
      ]

      const stats = TaskCategoryService.getCategoryStats(onlyTodayTasks)

      expect(stats['pret-today']).toBe(1)
      expect(stats.collected).toBe(0)
      expect(stats['pret-overdue']).toBe(0)
      expect(stats['pret-tomorrow']).toBe(0)
      expect(stats['pret-no-date']).toBe(0)
      expect(stats['pret-future']).toBe(0)
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
          status: 'pret',
          plannedDate: i % 2 === 0 ? '2023-06-15T12:00:00Z' : undefined
        })
      )

      const stats = TaskCategoryService.getCategoryStats(manyTasks)
      const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0)

      expect(totalCount).toBe(100)
      expect(stats['pret-today']).toBeGreaterThan(0)
      expect(stats['pret-no-date']).toBeGreaterThan(0)
    })
  })

  describe('filterTasksByCategory', () => {
    it('should filter tasks by specific category', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const todayTasks = TaskCategoryService.filterTasksByCategory(allTasks, 'pret-today')

      expect(todayTasks).toHaveLength(1)
      expect(todayTasks[0]).toBe(testTasks.today)
    })

    it('should return empty array for category with no tasks', () => {
      const testTasks = [
        createMockTaskEntity({ status: 'pret', plannedDate: '2023-06-15T12:00:00Z' }) // pret-today
      ]

      const overdueTasks = TaskCategoryService.filterTasksByCategory(testTasks, 'pret-overdue')

      expect(overdueTasks).toEqual([])
    })

    it('should not modify original array', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)
      const originalLength = allTasks.length

      TaskCategoryService.filterTasksByCategory(allTasks, 'pret-today')

      expect(allTasks.length).toBe(originalLength)
    })

    it('should filter all categories correctly', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks).map(t => t.rawTask)
      const categories: TaskCategory[] = ['collected', 'pret-overdue', 'pret-today', 'pret-tomorrow', 'pret-no-date', 'pret-future']

      categories.forEach(category => {
        const filtered = TaskCategoryService.filterTasksByCategory(allTasks, category)
        filtered.forEach(task => {
          expect(new TaskEntity(task).getCategory()).toBe(category)
        })
      })
    })

    it('should handle multiple tasks in same category', () => {
      const collectedTasks = [
        createMockTaskEntity({ status: 'collecte', importance: 0, complexity: 3, points: 0 }).rawTask,
        createMockTaskEntity({ status: 'collecte', importance: 0, complexity: 3, points: 0, name: 'Another collected' }).rawTask
      ]

      const filtered = TaskCategoryService.filterTasksByCategory(collectedTasks, 'collected')

      expect(filtered).toHaveLength(2)
      expect(filtered).toEqual(expect.arrayContaining(collectedTasks))
    })
  })

  describe('getActiveCategories', () => {
    it('should return categories that have tasks', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks).map(t => t.rawTask)

      const activeCategories = TaskCategoryService.getActiveCategories(allTasks)

      expect(activeCategories).toContain('collected')
      expect(activeCategories).toContain('pret-overdue')
      expect(activeCategories).toContain('pret-today')
      expect(activeCategories).toContain('pret-tomorrow')
      expect(activeCategories).toContain('pret-no-date')
      expect(activeCategories).toContain('pret-future')
    })

    it('should not return categories without tasks', () => {
      const onlyTodayTasks = [
        createMockTaskEntity({ status: 'pret', plannedDate: '2023-06-15T12:00:00Z' })
      ]

      const activeCategories = TaskCategoryService.getActiveCategories(onlyTodayTasks)

      expect(activeCategories).toContain('pret-today')
      expect(activeCategories).not.toContain('collected')
      expect(activeCategories).not.toContain('pret-overdue')
      expect(activeCategories).not.toContain('pret-tomorrow')
      expect(activeCategories).not.toContain('pret-no-date')
      expect(activeCategories).not.toContain('pret-future')
    })

    it('should return empty array for empty task list', () => {
      const activeCategories = TaskCategoryService.getActiveCategories([])

      expect(activeCategories).toEqual([])
    })

    it('should return unique categories only', () => {
      const duplicateTodayTasks = [
        createMockTaskEntity({ status: 'pret', plannedDate: '2023-06-15T12:00:00Z' }),
        createMockTaskEntity({ status: 'pret', plannedDate: '2023-06-15T15:00:00Z' }),
        createMockTaskEntity({ status: 'pret', plannedDate: '2023-06-15T18:00:00Z' })
      ]

      const activeCategories = TaskCategoryService.getActiveCategories(duplicateTodayTasks)

      expect(activeCategories).toEqual(['pret-today'])
      expect(activeCategories).toHaveLength(1)
    })

    it('should maintain category order based on priority', () => {
      const testTasks = createTestTasksByCategory()
      const allTasks = Object.values(testTasks)

      const activeCategories = TaskCategoryService.getActiveCategories(allTasks)

      // Should be ordered by priority (collected first, future last)
      expect(activeCategories.indexOf('collected')).toBeLessThan(activeCategories.indexOf('pret-overdue'))
      expect(activeCategories.indexOf('pret-overdue')).toBeLessThan(activeCategories.indexOf('pret-today'))
      expect(activeCategories.indexOf('pret-today')).toBeLessThan(activeCategories.indexOf('pret-tomorrow'))
      expect(activeCategories.indexOf('pret-tomorrow')).toBeLessThan(activeCategories.indexOf('pret-no-date'))
      expect(activeCategories.indexOf('pret-no-date')).toBeLessThan(activeCategories.indexOf('pret-future'))
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
          highPriorityNoDate: 'pret-no-date',
          overdue: 'pret-overdue',
          today: 'pret-today',
          tomorrow: 'pret-tomorrow',
          future: 'pret-future',
          noDate: 'pret-no-date'
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
          status: 'pret',
          importance: 20,
          complexity: 2,
          plannedDate: '2023-06-15T10:00:00Z'
        }).rawTask,
        createMockTaskEntity({
          name: 'Finish quarterly report',
          status: 'pret',
          importance: 40,
          complexity: 8,
          plannedDate: '2023-06-14T17:00:00Z' // Overdue
        }).rawTask,
        createMockTaskEntity({
          name: 'Review team performance',
          status: 'pret',
          importance: 35,
          complexity: 6,
          plannedDate: '2023-06-16T09:00:00Z' // Tomorrow
        }).rawTask,
        createMockTaskEntity({
          name: 'Random idea for app',
          status: 'collecte',
          importance: 0,
          complexity: 3,
          points: 0
        }).rawTask
      ]

      const groups = TaskCategoryService.groupTasksByCategory(realWorldTasks)
      const stats = TaskCategoryService.getCategoryStats(realWorldTasks)

      expect(groups['pret-today']).toHaveLength(1)
      expect(groups['pret-overdue']).toHaveLength(1)
      expect(groups['pret-tomorrow']).toHaveLength(1)
      expect(groups.collected).toHaveLength(1)

      expect(stats['pret-today']).toBe(1)
      expect(stats['pret-overdue']).toBe(1)
      expect(stats['pret-tomorrow']).toBe(1)
      expect(stats.collected).toBe(1)
    })
  })
})