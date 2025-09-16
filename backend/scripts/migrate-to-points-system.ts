#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Deterministic migration from old 3-field system to new points system
 * Maps (importance 1-5, urgency 1-5, priority 1-5) → (importance 0-50, complexity 1-9, points 0-500)
 */
function migrateTaskValues(oldImportance: number, oldUrgency: number, oldPriority: number) {
  // Calculate old_index (0-124) - this enumerates all combos lexicographically
  const oldIndex = (oldImportance - 1) * 25 + (oldUrgency - 1) * 5 + (oldPriority - 1)

  // Linear interpolation from endpoints:
  // (1,1,1) → index 0 → importance=50, complexity=1 → points=500
  // (5,5,5) → index 124 → importance=0, complexity=9 → points=0
  const newImportance = Math.round(50 * (1 - oldIndex / 124))
  const newComplexity = Math.round(1 + 8 * (oldIndex / 124))

  // Compute points = round(10 * importance / complexity), clamped to [0, 500]
  const points = Math.max(0, Math.min(500, Math.round(10 * newImportance / newComplexity)))

  return {
    importance: newImportance,
    complexity: newComplexity,
    points
  }
}

async function migrateData() {
  console.log('🚀 Starting migration to points system...')

  try {
    // First, let's see if we have the old columns
    const tasks = await prisma.$queryRaw`
      SELECT id, name, importance, urgency, priority
      FROM tasks
      WHERE urgency IS NOT NULL AND priority IS NOT NULL
      LIMIT 5
    ` as any[]

    if (tasks.length === 0) {
      console.log('✅ No tasks with old schema found. Migration may have already been completed.')
      return
    }

    console.log(`📊 Found ${tasks.length} tasks to migrate (showing first 5)`)

    // Show some examples of the migration
    console.log('\n📋 Migration examples:')
    for (const task of tasks) {
      const migrated = migrateTaskValues(task.importance, task.urgency, task.priority)
      console.log(`  ${task.name}: (${task.importance},${task.urgency},${task.priority}) → importance=${migrated.importance}, complexity=${migrated.complexity}, points=${migrated.points}`)
    }

    // Get total count
    const totalTasks = await prisma.task.count({
      where: {
        // We can't check for urgency/priority columns that don't exist yet
        // This will be run before the schema migration
      }
    })

    console.log(`\n🔄 Migrating ${totalTasks} total tasks...`)

    // Get all tasks for migration
    const allTasks = await prisma.$queryRaw`
      SELECT id, importance, urgency, priority, "createdAt"
      FROM tasks
    ` as any[]

    let migratedCount = 0

    for (const task of allTasks) {
      // Handle cases where old data might be missing or invalid
      const oldImportance = Math.max(1, Math.min(5, task.importance || 5))
      const oldUrgency = Math.max(1, Math.min(5, task.urgency || 5))
      const oldPriority = Math.max(1, Math.min(5, task.priority || 5))

      const migrated = migrateTaskValues(oldImportance, oldUrgency, oldPriority)

      // Determine if this is a collection task
      // Default tasks (5,5,5) with default points=40 are treated as collection
      const isCollection = (oldImportance === 5 && oldUrgency === 5 && oldPriority === 5) ||
                          migrated.points === 40

      await prisma.$executeRaw`
        UPDATE tasks
        SET
          importance = ${migrated.importance},
          complexity = ${migrated.complexity},
          points = ${migrated.points},
          "isCollection" = ${isCollection}
        WHERE id = ${task.id}
      `

      migratedCount++

      if (migratedCount % 100 === 0) {
        console.log(`  ✅ Migrated ${migratedCount}/${allTasks.length} tasks`)
      }
    }

    console.log(`\n✅ Successfully migrated ${migratedCount} tasks!`)

    // Verify migration results
    console.log('\n🔍 Verifying migration results...')

    const verifyTasks = await prisma.task.findMany({
      select: {
        id: true,
        name: true,
        importance: true,
        complexity: true,
        points: true,
        isCollection: true
      },
      take: 5
    })

    console.log('Sample migrated tasks:')
    for (const task of verifyTasks) {
      console.log(`  ${task.name}: importance=${task.importance}, complexity=${task.complexity}, points=${task.points}, collection=${task.isCollection}`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

async function main() {
  try {
    await migrateData()
  } catch (error) {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export { migrateTaskValues }