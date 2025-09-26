import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Global test setup - ensure clean database state
beforeAll(async () => {
  try {
    // Clean up in correct order to respect foreign key constraints
    // 1. First delete TaskTag junction table entries
    await prisma.taskTag.deleteMany({
      where: {
        task: {
          userId: {
            startsWith: 'test-user'
          }
        }
      }
    })

    // 2. Then delete tasks (including cascade delete of subtasks)
    await prisma.task.deleteMany({
      where: {
        userId: {
          startsWith: 'test-user'
        }
      }
    })

    // 3. Finally delete tags
    await prisma.tag.deleteMany({
      where: {
        userId: {
          startsWith: 'test-user'
        }
      }
    })

    console.log('✅ Test database cleanup completed successfully')
  } catch (error) {
    console.error('❌ Error during test database cleanup:', error)
    throw error
  }
}, 30000)

// Global test teardown
afterAll(async () => {
  try {
    await prisma.$disconnect()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error)
  }
}, 30000)