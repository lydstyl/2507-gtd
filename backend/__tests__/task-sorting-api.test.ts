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

    // Create tasks through API (status='pret' so they are categorized by date)
    const tasksToCreate = [
      { name: 'Future task', importance: 300, complexity: 3, status: 'pret', plannedDate: nextWeek.toISOString() },
      { name: 'High priority no date', importance: 400, complexity: 1, status: 'pret' },
      { name: 'Overdue task', importance: 250, complexity: 2, status: 'pret', plannedDate: yesterday.toISOString() },
      { name: 'Today task high', importance: 350, complexity: 2, status: 'pret', plannedDate: today.toISOString() },
      { name: 'Today task low', importance: 200, complexity: 3, status: 'pret', plannedDate: today.toISOString() },
      { name: 'Tomorrow task', importance: 320, complexity: 3, status: 'pret', plannedDate: tomorrow.toISOString() },
      { name: 'No date medium', importance: 300, complexity: 4, status: 'pret' },
      { name: 'No date low', importance: 200, complexity: 5, status: 'pret' },
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

    // Verify exact sorting order of our test tasks - overdue, today, tomorrow, then no-date by importance
    expect(testTasks[0].name).toBe('Overdue task') // 1. Overdue
    expect(testTasks[1].name).toBe('Today task high') // 2. Today (higher importance)
    expect(testTasks[2].name).toBe('Today task low') // 2. Today (lower importance)
    expect(testTasks[3].name).toBe('Tomorrow task') // 3. Tomorrow
    expect(testTasks[4].name).toBe('High priority no date') // 4. No date (400 importance)
    expect(testTasks[5].name).toBe('No date medium') // 4. No date (higher importance)
    expect(testTasks[6].name).toBe('No date low') // 4. No date (lower importance)
    expect(testTasks[7].name).toBe('Future task') // 5. Future

    console.log('\n📋 API Sorting Order:')
    tasks.forEach((task: any, index: number) => {
      const dateStr = task.plannedDate ? new Date(task.plannedDate).toLocaleDateString() : 'No date'
      console.log(`${index + 1}. ${task.name} (Importance: ${task.importance}, Planned: ${dateStr})`)
    })
  })

  test('Should maintain sorting when task is updated via API', async () => {
    // Create initial tasks (status='pret' so they're categorized by date)
    const highPriorityTask = await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Test 400 importance task',
        importance: 400,
        complexity: 1,
        status: 'pret'
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Today existing task',
        importance: 300,
        complexity: 2,
        status: 'pret',
        plannedDate: new Date().toISOString()
      })
      .expect(201)

    // Verify initial sorting
    let response = await request(app)
      .get('/api/tasks/root')
      .set(authHeader)
      .expect(200)

    expect(response.body[0].name).toBe('Today existing task') // Today task comes first
    expect(response.body[1].name).toBe('Test 400 importance task') // High-importance task in no-date category
    expect(response.body[1].plannedDate).toBeFalsy() // Can be null or undefined

    // Update the high-importance task to have today's date
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
    expect(todayTasks[0].name).toBe('Test 400 importance task') // Should be first in today section due to higher importance
    expect(todayTasks[0].importance).toBe(400)
    expect(todayTasks[1].name).toBe('Today existing task')

    console.log('\n✅ API: Task successfully moved from high-priority category to today category!')
  })

  test('Should handle overdue tasks correctly via API', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Create tasks with different overdue dates (status='pret' so they're sorted by date)
    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'High priority no date',
        importance: 400,
        complexity: 1,
        status: 'pret'
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Overdue yesterday high importance',
        importance: 350,
        complexity: 2,
        status: 'pret',
        plannedDate: yesterday.toISOString()
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Overdue yesterday low importance',
        importance: 200,
        complexity: 3,
        status: 'pret',
        plannedDate: yesterday.toISOString()
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader)
      .send({
        name: 'Overdue two days ago',
        importance: 300,
        complexity: 3,
        status: 'pret',
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
    expect(tasks[1].name).toBe('Overdue yesterday high importance') // 2. Same date, higher importance
    expect(tasks[2].name).toBe('Overdue yesterday low importance') // 2. Same date, lower importance
    expect(tasks[3].name).toBe('High priority no date') // 3. No-date tasks by importance

    console.log('\n📅 Overdue Tasks Sorting:')
    tasks.forEach((task: any, index: number) => {
      const dateStr = task.plannedDate ? new Date(task.plannedDate).toLocaleDateString() : 'No date'
      const status = task.plannedDate && new Date(task.plannedDate) < today ? 'OVERDUE' : 'NORMAL'
      console.log(`${index + 1}. ${task.name} (${status}, Importance: ${task.importance}, Planned: ${dateStr})`)
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

    // Create a complex mix of tasks (status='pret' so they're categorized by date)
    const taskData = [
      // Mix up the creation order to test sorting independence
      { name: 'Z Future low priority', importance: 200, complexity: 5, status: 'pret', plannedDate: nextWeek.toISOString() },
      { name: 'A High priority no date 1', importance: 400, complexity: 1, status: 'pret' },
      { name: 'M Today medium', importance: 300, complexity: 3, status: 'pret', plannedDate: today.toISOString() },
      { name: 'B Overdue critical', importance: 380, complexity: 2, status: 'pret', plannedDate: yesterday.toISOString() },
      { name: 'Y Tomorrow low', importance: 250, complexity: 4, status: 'pret', plannedDate: tomorrow.toISOString() },
      { name: 'A High priority no date 2', importance: 400, complexity: 1, status: 'pret' },
      { name: 'N No date very low', importance: 100, complexity: 8, status: 'pret' },
      { name: 'L Today high', importance: 350, complexity: 2, status: 'pret', plannedDate: today.toISOString() },
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

    // High importance no date tasks should be in the no-date section (after tomorrow tasks)
    const noDateTasks = tasks.filter((task: any) => !task.plannedDate)
    const highImportanceNoDateTasks = noDateTasks.filter((task: any) => task.importance === 400)
    expect(highImportanceNoDateTasks.length).toBe(2) // Should have 2 high importance no date tasks
    expect(highImportanceNoDateTasks.every((task: any) => task.importance === 400 && !task.plannedDate)).toBe(true)

    // No-date tasks should follow tomorrow tasks, sorted by importance descending
    // High importance no date tasks come first due to high importance
    expect(tasks[5].name.includes('High priority no date')).toBe(true)
    expect(tasks[6].name).toBe('N No date very low') // Lower importance no date task
    expect(tasks[7].name).toBe('Z Future low priority') // Future task last

    console.log('\n🎯 Complex Mixed Scenario - Final Order:')
    tasks.forEach((task: any, index: number) => {
      const dateStr = task.plannedDate ? new Date(task.plannedDate).toLocaleDateString() : 'No date'
      console.log(`${index + 1}. ${task.name} (Importance: ${task.importance}, Planned: ${dateStr})`)
    })
  })
})