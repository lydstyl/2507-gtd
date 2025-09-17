import { PrismaClient } from '@prisma/client'
import { PrismaTaskRepository } from '../src/infrastructure/repositories/PrismaTaskRepository'
import { TaskSorting } from '../src/infrastructure/repositories/TaskSorting'
import { TaskWithSubtasks } from '../src/domain/entities/Task'

const prisma = new PrismaClient()
const taskRepository = new PrismaTaskRepository(prisma)

describe('Comprehensive Task Sorting Tests', () => {
  const userId = 'test-user-comprehensive-sorting'
  const userEmail = 'test-comprehensive-sorting@example.com'

  beforeAll(async () => {
    // Create test user
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: userEmail,
        password: 'test-password',
      },
    })
    // Clean up test tasks
    await prisma.task.deleteMany({
      where: { userId }
    })
  })

  beforeEach(async () => {
    // Clean up test tasks before each test to prevent contamination
    // Only clean up tasks for this specific test user
    await prisma.task.deleteMany({
      where: {
        userId,
        name: {
          in: ['High priority no date', 'Overdue task', 'Today task', 'Tomorrow task', 'No date medium', 'Future task', 'Test task 500 points', 'Today existing']
        }
      }
    })
  })

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: { userId }
    })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  describe('TaskSorting Unit Tests', () => {
    const createTestTask = (name: string, points: number, dueDate?: string, createdAt?: Date): TaskWithSubtasks => ({
      id: `test-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      points,
      importance: 30,
      complexity: 3,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isCompleted: false,
      createdAt: createdAt || new Date(),
      updatedAt: new Date(),
      userId,
      subtasks: [],
      tags: [],
      parentId: undefined
    })

    test('should prioritize 500-point tasks without dates first', () => {
      const today = new Date().toISOString()

      const tasks = [
        createTestTask('Normal task', 200),
        createTestTask('High priority no date', 500), // Should be first
        createTestTask('Today task', 300, today),
        createTestTask('Another high priority no date', 500), // Should be second
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('High priority no date')
      expect(sorted[1].name).toBe('Another high priority no date')
      expect(sorted[0].points).toBe(500)
      expect(sorted[1].points).toBe(500)
      expect(sorted[0].dueDate).toBeUndefined()
      expect(sorted[1].dueDate).toBeUndefined()
    })

    test('should put 500-point tasks with dates in appropriate date categories', () => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const overdue = new Date(today)
      overdue.setDate(overdue.getDate() - 1)

      const tasks = [
        createTestTask('High priority no date', 500), // Should be first
        createTestTask('High priority today', 500, today.toISOString()), // Should be in today section
        createTestTask('High priority tomorrow', 500, tomorrow.toISOString()), // Should be in tomorrow section
        createTestTask('High priority overdue', 500, overdue.toISOString()), // Should be in overdue section
        createTestTask('Normal today', 200, today.toISOString()),
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      // First should be 500-point task without date
      expect(sorted[0].name).toBe('High priority no date')
      expect(sorted[0].dueDate).toBeUndefined()

      // Second should be overdue 500-point task
      expect(sorted[1].name).toBe('High priority overdue')
      expect(new Date(sorted[1].dueDate!)).toEqual(overdue)

      // Today tasks should come next (including 500-point today task)
      const todayTasks = sorted.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        return taskDate.toDateString() === today.toDateString()
      })
      expect(todayTasks.length).toBe(2)
      expect(todayTasks.some(task => task.name === 'High priority today')).toBe(true)
      expect(todayTasks.some(task => task.name === 'Normal today')).toBe(true)
    })

    test('should handle overdue tasks correctly', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const tasks = [
        createTestTask('Normal task', 200),
        createTestTask('Overdue yesterday', 100, yesterday.toISOString()),
        createTestTask('Overdue two days', 300, twoDaysAgo.toISOString()),
        createTestTask('High priority no date', 500),
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      // High priority no date should be first
      expect(sorted[0].name).toBe('High priority no date')

      // Overdue tasks should come next, oldest first
      expect(sorted[1].name).toBe('Overdue two days')
      expect(sorted[2].name).toBe('Overdue yesterday')
    })

    test('should sort today tasks by points descending', () => {
      const today = new Date().toISOString()

      const tasks = [
        createTestTask('Today low priority', 100, today),
        createTestTask('Today high priority', 400, today),
        createTestTask('Today medium priority', 250, today),
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('Today high priority')
      expect(sorted[1].name).toBe('Today medium priority')
      expect(sorted[2].name).toBe('Today low priority')
      expect(sorted[0].points).toBe(400)
      expect(sorted[1].points).toBe(250)
      expect(sorted[2].points).toBe(100)
    })

    test('should sort tomorrow tasks by points descending', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowISO = tomorrow.toISOString()

      const tasks = [
        createTestTask('Tomorrow low priority', 150, tomorrowISO),
        createTestTask('Tomorrow high priority', 350, tomorrowISO),
        createTestTask('Tomorrow medium priority', 200, tomorrowISO),
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('Tomorrow high priority')
      expect(sorted[1].name).toBe('Tomorrow medium priority')
      expect(sorted[2].name).toBe('Tomorrow low priority')
      expect(sorted[0].points).toBe(350)
      expect(sorted[1].points).toBe(200)
      expect(sorted[2].points).toBe(150)
    })

    test('should sort tasks without dates by points descending (excluding 500+ already handled)', () => {
      const tasks = [
        createTestTask('No date low', 100),
        createTestTask('No date high priority', 500), // Should be first
        createTestTask('No date medium', 250),
        createTestTask('No date higher', 400),
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('No date high priority') // 500-point task first
      expect(sorted[1].name).toBe('No date higher') // 400 points
      expect(sorted[2].name).toBe('No date medium') // 250 points
      expect(sorted[3].name).toBe('No date low') // 100 points
    })

    test('should sort future tasks by date ascending', () => {
      const today = new Date()
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const tasks = [
        createTestTask('Next month', 200, nextMonth.toISOString()),
        createTestTask('Day after tomorrow', 300, dayAfterTomorrow.toISOString()),
        createTestTask('Next week', 100, nextWeek.toISOString()),
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('Day after tomorrow')
      expect(sorted[1].name).toBe('Next week')
      expect(sorted[2].name).toBe('Next month')
    })

    test('should handle complete sorting priority order', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      const tasks = [
        createTestTask('Future task', 200, dayAfterTomorrow.toISOString()), // 6th priority
        createTestTask('No date low', 100), // 5th priority (after high priority no date)
        createTestTask('Tomorrow task', 300, tomorrow.toISOString()), // 4th priority
        createTestTask('Today task', 250, today.toISOString()), // 3rd priority
        createTestTask('Overdue task', 200, yesterday.toISOString()), // 2nd priority
        createTestTask('High priority no date', 500), // 1st priority
        createTestTask('No date high', 400), // 5th priority (but higher points)
      ]

      const sorted = TaskSorting.sortTasksByPriority(tasks)

      expect(sorted[0].name).toBe('High priority no date') // 1. 500-point no date
      expect(sorted[1].name).toBe('Overdue task') // 2. Overdue
      expect(sorted[2].name).toBe('Today task') // 3. Today
      expect(sorted[3].name).toBe('Tomorrow task') // 4. Tomorrow
      expect(sorted[4].name).toBe('No date high') // 5. No date (400 points)
      expect(sorted[5].name).toBe('No date low') // 5. No date (100 points)
      expect(sorted[6].name).toBe('Future task') // 6. Future
    })
  })

  describe('Integration Tests with Database', () => {
    test('should sort tasks correctly when fetched from database', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Create test tasks
      const testTasks = [
        { name: 'Future task', importance: 30, complexity: 3, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        { name: 'High priority no date', importance: 50, complexity: 1, dueDate: null }, // 500 points
        { name: 'Overdue task', importance: 25, complexity: 2, dueDate: yesterday },
        { name: 'Today task', importance: 30, complexity: 2, dueDate: today },
        { name: 'Tomorrow task', importance: 35, complexity: 3, dueDate: tomorrow },
        { name: 'No date medium', importance: 20, complexity: 4, dueDate: null },
      ]

      // Create tasks in database
      for (const taskData of testTasks) {
        await taskRepository.create({
          name: taskData.name,
          importance: taskData.importance,
          complexity: taskData.complexity,
          dueDate: taskData.dueDate || undefined,
          userId
        })
      }

      // Fetch sorted tasks
      const sortedTasks = await taskRepository.findAllRootTasks({ userId })

      console.log('\n📋 Database Integration - Sorted Tasks:')
      sortedTasks.forEach((task, index) => {
        const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'
        console.log(`${index + 1}. ${task.name} (Points: ${task.points}, Due: ${dateStr})`)
      })

      // Verify sorting order
      expect(sortedTasks[0].name).toBe('High priority no date') // 500 points, no date
      expect(sortedTasks[1].name).toBe('Overdue task') // Overdue
      expect(sortedTasks[2].name).toBe('Today task') // Today
      expect(sortedTasks[3].name).toBe('Tomorrow task') // Tomorrow
      expect(sortedTasks[4].name).toBe('No date medium') // No date, lower points
      expect(sortedTasks[5].name).toBe('Future task') // Future date

      expect(sortedTasks.length).toBe(6)
    })

    test('should maintain correct sorting when task date is updated', async () => {
      // Create a 500-point task without date
      const task = await taskRepository.create({
        name: 'Test task 500 points',
        importance: 50,
        complexity: 1, // 500 points
        userId
      })

      // Create other tasks for comparison
      await taskRepository.create({
        name: 'Today existing',
        importance: 30,
        complexity: 2,
        dueDate: new Date(),
        userId
      })

      // Verify initial sorting - 500-point task should be first
      let sortedTasks = await taskRepository.findAllRootTasks({ userId })
      expect(sortedTasks[0].name).toBe('Test task 500 points')
      expect(sortedTasks[0].dueDate).toBeUndefined()

      // Update the 500-point task to have today's date
      await taskRepository.update(task.id, {
        dueDate: new Date(),
        userId
      })

      // Fetch again and verify it moved to today section
      sortedTasks = await taskRepository.findAllRootTasks({ userId })

      // Both tasks should be in today section, 500-point task should be first within today tasks
      const todayTasks = sortedTasks.filter(t => {
        if (!t.dueDate) return false
        const taskDate = new Date(t.dueDate)
        const today = new Date()
        return taskDate.toDateString() === today.toDateString()
      })

      expect(todayTasks.length).toBe(2)
      expect(todayTasks[0].name).toBe('Test task 500 points') // Higher points
      expect(todayTasks[0].points).toBe(500)
      expect(todayTasks[1].name).toBe('Today existing')

      console.log('\n✅ Task successfully moved from high-priority-no-date to today category!')
    })
  })
})