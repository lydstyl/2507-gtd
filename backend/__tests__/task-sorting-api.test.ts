import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../src/app'
import { getTestAuthHeader, createTestUser } from './helpers/auth.helper'

const prisma = new PrismaClient()

describe('Task Sorting API Integration Tests', () => {
  const testUser = createTestUser('task-sorting')
  const authHeader = getTestAuthHeader(testUser)

  beforeAll(async () => {
    // Create test user (same as other tests)
    await prisma.user.upsert({
      where: { id: testUser.userId },
      update: {},
      create: {
        id: testUser.userId,
        email: testUser.email,
        password: 'hashed-password'
      }
    })
  })

  afterAll(async () => {
    // Clean up all test tasks to prevent contamination
    await prisma.task.deleteMany({ where: { userId: testUser.userId } })
    await prisma.task.deleteMany({
      where: {
        userId: {
          contains: 'test'
        }
      }
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up tasks before each test
    await prisma.task.deleteMany({ where: { userId: testUser.userId } })

    // Also clean up any other test users' tasks to prevent contamination
    await prisma.task.deleteMany({
      where: {
        userId: {
          contains: 'test'
        }
      }
    })
  })

  test('GET /api/tasks/root should return tasks in correct sorting order', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Create tasks through API
    const tasksToCreate = [
      { name: 'Future task', importance: 30, complexity: 3, plannedDate: nextWeek.toISOString() },
      { name: 'High priority no date', importance: 50, complexity: 1 }, // 500 points, no date
      { name: 'Overdue task', importance: 25, complexity: 2, plannedDate: yesterday.toISOString() },
      { name: 'Today task high', importance: 40, complexity: 2, plannedDate: today.toISOString() },
      { name: 'Today task low', importance: 20, complexity: 3, plannedDate: today.toISOString() },
      { name: 'Tomorrow task', importance: 35, complexity: 3, plannedDate: tomorrow.toISOString() },
      { name: 'No date medium', importance: 30, complexity: 4 },
      { name: 'No date low', importance: 20, complexity: 5 },
    ]

    // Create all tasks
    for (const taskData of tasksToCreate) {
      await request(app)
        .post('/api/tasks')
        .set(authHeader)
        .send(taskData)
        .expect(201)
    }

    // Get sorted tasks
    const response = await request(app)
      .get('/api/tasks/root')
      .set(authHeader)
      .expect(200)

    const tasks = response.body
    expect(tasks.length).toBeGreaterThanOrEqual(8) // Allow for potential test contamination

    // Filter to only our test tasks to avoid interference from other tests
    const testTasks = tasks.filter((task: any) =>
      ['High priority no date', 'Overdue task', 'Today task high', 'Today task low',
       'Tomorrow task', 'No date medium', 'No date low', 'Future task'].includes(task.name)
    )

    expect(testTasks.length).toBe(8)

    // Verify exact sorting order of our test tasks - overdue, today, tomorrow, then no-date by points
    expect(testTasks[0].name).toBe('Overdue task') // 1. Overdue
    expect(testTasks[1].name).toBe('Today task high') // 2. Today (higher points)
    expect(testTasks[2].name).toBe('Today task low') // 2. Today (lower points)
    expect(testTasks[3].name).toBe('Tomorrow task') // 3. Tomorrow
    expect(testTasks[4].name).toBe('High priority no date') // 4. No date (500 points)
    expect(testTasks[5].name).toBe('No date medium') // 4. No date (higher points)
    expect(testTasks[6].name).toBe('No date low') // 4. No date (lower points)
    expect(testTasks[7].name).toBe('Future task') // 5. Future

    console.log('\n📋 API Sorting Order:')
    tasks.forEach((task: any, index: number) => {
      const dateStr = task.plannedDate ? new Date(task.plannedDate).toLocaleDateString() : 'No date'
      console.log(`${index + 1}. ${task.name} (Points: ${task.points}, Planned: ${dateStr})`)
    })
  })

  test('Should maintain sorting when task is updated via API', async () => {
    // Create initial tasks
    const highPriorityTask = await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Test 500 point task',
        importance: 50,
        complexity: 1 // 500 points
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Today existing task',
        importance: 30,
        complexity: 2,
        plannedDate: new Date().toISOString()
      })
      .expect(201)

    // Verify initial sorting
    let response = await request(app)
      .get('/api/tasks/root')
      .set(authHeader)
      .expect(200)

    expect(response.body[0].name).toBe('Today existing task') // Today task comes first
    expect(response.body[1].name).toBe('Test 500 point task') // 500-point task in no-date category
    expect(response.body[1].plannedDate).toBeFalsy() // Can be null or undefined

    // Update the 500-point task to have today's date
    await request(app)
      .put(`/api/tasks/${highPriorityTask.body.id}`)
      .set(authHeader)
      .send({
        plannedDate: new Date().toISOString()
      })
      .expect(200)

    // Verify new sorting - should move to today section
    response = await request(app)
      .get('/api/tasks/root')
      .set(authHeader)
      .expect(200)

    const tasks = response.body

    // Find today tasks
    const todayTasks = tasks.filter((task: any) => {
      if (!task.plannedDate) return false
      const taskDate = new Date(task.plannedDate)
      const today = new Date()
      return taskDate.toDateString() === today.toDateString()
    })

    expect(todayTasks.length).toBe(2)
    expect(todayTasks[0].name).toBe('Test 500 point task') // Should be first in today section due to higher points
    expect(todayTasks[0].points).toBe(500)
    expect(todayTasks[1].name).toBe('Today existing task')

    console.log('\n✅ API: Task successfully moved from high-priority category to today category!')
  })

  test('Should handle overdue tasks correctly via API', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Create tasks with different overdue dates
    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'High priority no date',
        importance: 50,
        complexity: 1
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Overdue yesterday high points',
        importance: 40,
        complexity: 2,
        plannedDate: yesterday.toISOString()
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Overdue yesterday low points',
        importance: 20,
        complexity: 3,
        plannedDate: yesterday.toISOString()
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Overdue two days ago',
        importance: 30,
        complexity: 3,
        plannedDate: twoDaysAgo.toISOString()
      })
      .expect(201)

    // Get sorted tasks
    const response = await request(app)
      .get('/api/tasks/root')
      .set(authHeader)
      .expect(200)

    const tasks = response.body

    // Verify order - overdue tasks come first, then no-date tasks
    expect(tasks[0].name).toBe('Overdue two days ago') // 1. Oldest overdue first
    expect(tasks[1].name).toBe('Overdue yesterday high points') // 2. Same date, higher points
    expect(tasks[2].name).toBe('Overdue yesterday low points') // 2. Same date, lower points
    expect(tasks[3].name).toBe('High priority no date') // 3. No-date tasks by points

    console.log('\n📅 Overdue Tasks Sorting:')
    tasks.forEach((task: any, index: number) => {
      const dateStr = task.plannedDate ? new Date(task.plannedDate).toLocaleDateString() : 'No date'
      const status = task.plannedDate && new Date(task.plannedDate) < today ? 'OVERDUE' : 'NORMAL'
      console.log(`${index + 1}. ${task.name} (${status}, Points: ${task.points}, Planned: ${dateStr})`)
    })
  })

  test('Should handle complex mixed scenario via API', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Create a complex mix of tasks
    const taskData = [
      // Mix up the creation order to test sorting independence
      { name: 'Z Future low priority', importance: 20, complexity: 5, plannedDate: nextWeek.toISOString() },
      { name: 'A High priority no date 1', importance: 50, complexity: 1 },
      { name: 'M Today medium', importance: 30, complexity: 3, plannedDate: today.toISOString() },
      { name: 'B Overdue critical', importance: 45, complexity: 2, plannedDate: yesterday.toISOString() },
      { name: 'Y Tomorrow low', importance: 25, complexity: 4, plannedDate: tomorrow.toISOString() },
      { name: 'A High priority no date 2', importance: 50, complexity: 1 },
      { name: 'N No date very low', importance: 10, complexity: 8 },
      { name: 'L Today high', importance: 40, complexity: 2, plannedDate: today.toISOString() },
    ]

    // Create tasks in mixed order
    for (const task of taskData) {
      await request(app)
        .post('/api/tasks')
        .set(authHeader)
        .send(task)
        .expect(201)
    }

    // Get sorted tasks
    const response = await request(app)
      .get('/api/tasks/root')
      .set(authHeader)
      .expect(200)

    const tasks = response.body
    expect(tasks.length).toBe(8)

    // Verify sorting categories (order within same category may vary due to creation time)
    expect(tasks.length).toBe(8)

    // Check that the right categories are in the right positions
    // Overdue task should be first
    expect(tasks[0].name).toBe('B Overdue critical')

    // Today tasks should be next
    const todayTasks = tasks.slice(1, 3)
    expect(todayTasks.every((task: any) => {
      const taskDate = new Date(task.plannedDate)
      const today = new Date()
      return taskDate.toDateString() === today.toDateString()
    })).toBe(true)

    // High priority no date tasks should be in the no-date section (after tomorrow tasks)
    const noDateTasks = tasks.filter((task: any) => !task.plannedDate)
    const highPriorityNoDateTasks = noDateTasks.filter((task: any) => task.points === 500)
    expect(highPriorityNoDateTasks.length).toBe(2) // Should have 2 high priority no date tasks
    expect(highPriorityNoDateTasks.every((task: any) => task.points === 500 && !task.plannedDate)).toBe(true)

    // No-date tasks should follow tomorrow tasks, sorted by points descending
    // High priority no date tasks come first due to high points
    expect(tasks[5].name.includes('High priority no date')).toBe(true) // 500 points
    expect(tasks[6].name).toBe('N No date very low') // Lower points no date task
    expect(tasks[7].name).toBe('Z Future low priority') // Future task last

    console.log('\n🎯 Complex Mixed Scenario - Final Order:')
    tasks.forEach((task: any, index: number) => {
      const dateStr = task.plannedDate ? new Date(task.plannedDate).toLocaleDateString() : 'No date'
      console.log(`${index + 1}. ${task.name} (Points: ${task.points}, Planned: ${dateStr})`)
    })
  })
})