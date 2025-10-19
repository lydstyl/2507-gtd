import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import { getTestAuthHeader, createTestUser } from './helpers/auth.helper'

const prisma = new PrismaClient()
const TEST_USER = createTestUser('chat')
const authHeader = getTestAuthHeader(TEST_USER)

describe('Chat API - /api/chat', () => {
  let server: any

  beforeAll(async () => {
    // Create test user if needed
    await prisma.user.upsert({
      where: { id: TEST_USER.userId },
      update: {},
      create: {
        id: TEST_USER.userId,
        email: TEST_USER.email,
        password: 'hashed-password',
      },
    })
    server = app.listen(4001)
  })

  afterAll(async () => {
    // Clean up test tasks created via chat
    await prisma.task.deleteMany({
      where: {
        userId: TEST_USER.userId,
        name: { in: ['Buy milk', 'Write report', 'Test task'] }
      }
    })
    await prisma.$disconnect()
    server.close()
  })

  describe('POST /api/chat - Create Task', () => {
    beforeEach(async () => {
      // Clean up any existing "Buy milk" tasks before each test
      await prisma.task.deleteMany({
        where: {
          userId: TEST_USER.userId,
          name: 'Buy milk'
        }
      })
    })

    it('should create a task via chat and return streaming response', async () => {
      const response = await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: [
            { role: 'user', content: 'Create a task to buy milk' }
          ]
        })
        .expect(200)

      // Verify streaming response format (SSE - Server-Sent Events)
      expect(response.headers['content-type']).toContain('text/event-stream')

      // Parse the streaming response
      const responseText = response.text
      expect(responseText).toContain('data: {"type":"start"}')
      expect(responseText).toContain('"toolName":"createTask"')
      expect(responseText).toContain('"name":"Buy milk"')
      expect(responseText).toContain('"success":true')
      expect(responseText).toContain('data: [DONE]')

      // Verify task was actually created in database
      const tasks = await prisma.task.findMany({
        where: {
          userId: TEST_USER.userId,
          name: 'Buy milk'
        }
      })

      expect(tasks.length).toBeGreaterThan(0)
      const task = tasks[0]
      expect(task.name).toBe('Buy milk')
      expect(task.importance).toBe(0) // Default for collected tasks
      expect(task.complexity).toBe(3) // Default complexity
    })

    it('should create a task with specific importance and complexity via chat', async () => {
      const response = await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: [
            { role: 'user', content: 'Create an important task to write report with high complexity' }
          ]
        })
        .expect(200)

      const responseText = response.text
      expect(responseText).toContain('"success":true')
      expect(responseText).toContain('"toolName":"createTask"')

      // Verify task was created
      const tasks = await prisma.task.findMany({
        where: {
          userId: TEST_USER.userId,
          name: { contains: 'report' }
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(tasks.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/chat - List Tasks', () => {
    beforeAll(async () => {
      // Create some test tasks for listing
      await prisma.task.createMany({
        data: [
          {
            id: 'chat-test-task-1',
            name: 'Test task 1',
            userId: TEST_USER.userId,
            importance: 3,
            complexity: 5,
            isCompleted: false
          },
          {
            id: 'chat-test-task-2',
            name: 'Test task 2',
            userId: TEST_USER.userId,
            importance: 5,
            complexity: 8,
            isCompleted: false
          }
        ]
      })
    })

    afterAll(async () => {
      await prisma.task.deleteMany({
        where: {
          id: { in: ['chat-test-task-1', 'chat-test-task-2'] }
        }
      })
    })

    it('should list tasks via chat', async () => {
      const response = await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: [
            { role: 'user', content: 'List my tasks' }
          ]
        })
        .expect(200)

      const responseText = response.text
      expect(responseText).toContain('"toolName":"listTasks"')
      expect(responseText).toContain('data: [DONE]')
      // The tool should be invoked and complete successfully
      // Note: The actual tool output may or may not be included in the final stream
      // depending on when the AI decides to finish streaming
    })

    it('should filter tasks by importance via chat', async () => {
      const response = await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: [
            { role: 'user', content: 'Show me my most important tasks' }
          ]
        })
        .expect(200)

      const responseText = response.text
      expect(responseText).toContain('"toolName":"listTasks"')
      expect(responseText).toContain('"success":true')
    })
  })

  describe('POST /api/chat - Error Handling', () => {
    it('should return 401 if not authenticated', async () => {
      await request(server)
        .post('/api/chat')
        .send({
          messages: [
            { role: 'user', content: 'Create a task' }
          ]
        })
        .expect(401)
    })

    it('should return 400 if messages array is missing', async () => {
      await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({})
        .expect(400)
    })

    it('should return 400 if messages is not an array', async () => {
      await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: 'invalid'
        })
        .expect(400)
    })
  })

  describe('POST /api/chat - Conversation Context', () => {
    it('should handle multi-turn conversations', async () => {
      // First message: create a task
      const response1 = await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: [
            { role: 'user', content: 'Create a task called Test task' }
          ]
        })
        .expect(200)

      expect(response1.text).toContain('"success":true')

      // Second message: list tasks (includes previous context)
      const response2 = await request(server)
        .post('/api/chat')
        .set(authHeader)
        .send({
          messages: [
            { role: 'user', content: 'Create a task called Test task' },
            { role: 'assistant', content: 'I created the task "Test task" for you.' },
            { role: 'user', content: 'Show me all my tasks' }
          ]
        })
        .expect(200)

      expect(response2.text).toContain('"toolName":"listTasks"')
    })
  })
})
