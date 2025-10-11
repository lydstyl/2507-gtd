/**
 * Script to initialize position values for existing tasks
 * This ensures all tasks have proper position values for drag & drop
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeTaskPositions() {
  console.log('Starting task position initialization...')

  try {
    // Get all tasks grouped by parent
    const tasks = await prisma.task.findMany({
      orderBy: [
        { parentId: 'asc' },
        { points: 'desc' }
      ]
    })

    // Group tasks by parent
    const tasksByParent = new Map<string | null, typeof tasks>()

    for (const task of tasks) {
      const parentId = task.parentId || null
      if (!tasksByParent.has(parentId)) {
        tasksByParent.set(parentId, [])
      }
      tasksByParent.get(parentId)!.push(task)
    }

    let updateCount = 0

    // Update positions for each group
    for (const [parentId, siblingTasks] of tasksByParent.entries()) {
      // Assign positions in descending order (higher = earlier in list)
      let position = 10000
      const spacing = 100

      for (const task of siblingTasks) {
        if (task.position === 0) {
          await prisma.task.update({
            where: { id: task.id },
            data: { position }
          })
          console.log(`Updated task "${task.name}" (${task.id}) with position ${position}`)
          updateCount++
        }
        position -= spacing
      }
    }

    console.log(`✓ Successfully initialized positions for ${updateCount} tasks`)
  } catch (error) {
    console.error('Error initializing task positions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
initializeTaskPositions()
  .then(() => {
    console.log('Task position initialization complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Task position initialization failed:', error)
    process.exit(1)
  })
