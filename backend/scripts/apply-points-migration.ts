#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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

async function applyMigration() {
  console.log('🚀 Applying points system migration...')

  try {
    // Load extracted data
    const dataPath = path.join(__dirname, 'task-migration-data.json')

    if (!fs.existsSync(dataPath)) {
      console.log('❌ No migration data found. Please run pre-migrate-extract-data.ts first.')
      return
    }

    const tasks = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as Array<{
      id: string,
      name: string,
      importance: number,
      urgency: number,
      priority: number,
      createdAt: string
    }>

    console.log(`📊 Found ${tasks.length} tasks to migrate`)

    // Show some examples of the migration
    console.log('\n📋 Migration examples:')
    const samples = tasks.slice(0, 5)
    for (const task of samples) {
      const migrated = migrateTaskValues(task.importance, task.urgency, task.priority)
      console.log(`  ${task.name}: (${task.importance},${task.urgency},${task.priority}) → importance=${migrated.importance}, complexity=${migrated.complexity}, points=${migrated.points}`)
    }

    // Verify extreme cases
    console.log('\n🔍 Verifying endpoint mapping:')
    const minCase = migrateTaskValues(1, 1, 1)
    const maxCase = migrateTaskValues(5, 5, 5)
    console.log(`  (1,1,1) → importance=${minCase.importance}, complexity=${minCase.complexity}, points=${minCase.points} (should be 500)`)
    console.log(`  (5,5,5) → importance=${maxCase.importance}, complexity=${maxCase.complexity}, points=${maxCase.points} (should be 0)`)

    console.log(`\n🔄 Migrating ${tasks.length} tasks...`)

    let migratedCount = 0

    for (const task of tasks) {
      // Handle cases where old data might be missing or invalid
      const oldImportance = Math.max(1, Math.min(5, task.importance || 5))
      const oldUrgency = Math.max(1, Math.min(5, task.urgency || 5))
      const oldPriority = Math.max(1, Math.min(5, task.priority || 5))

      const migrated = migrateTaskValues(oldImportance, oldUrgency, oldPriority)

      // Determine if this is a collection task
      // Default tasks (5,5,5) with points=0 are treated as collection tasks
      // Also treat tasks with default points (40) as collection
      const isCollection = (oldImportance === 5 && oldUrgency === 5 && oldPriority === 5) ||
                          migrated.points === 40

      await prisma.task.update({
        where: { id: task.id },
        data: {
          importance: migrated.importance,
          complexity: migrated.complexity,
          points: migrated.points,
          isCollection
        }
      })

      migratedCount++

      if (migratedCount % 100 === 0) {
        console.log(`  ✅ Migrated ${migratedCount}/${tasks.length} tasks`)
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

    // Stats
    const totalTasks = await prisma.task.count()
    const collectionTasks = await prisma.task.count({ where: { isCollection: true } })
    const highPriorityTasks = await prisma.task.count({ where: { points: { gte: 400 } } })
    const mediumPriorityTasks = await prisma.task.count({ where: { points: { gte: 200, lt: 400 } } })
    const lowPriorityTasks = await prisma.task.count({ where: { points: { lt: 200 } } })

    console.log('\n📊 Migration statistics:')
    console.log(`  Total tasks: ${totalTasks}`)
    console.log(`  Collection tasks: ${collectionTasks}`)
    console.log(`  High priority (≥400 points): ${highPriorityTasks}`)
    console.log(`  Medium priority (200-399 points): ${mediumPriorityTasks}`)
    console.log(`  Low priority (<200 points): ${lowPriorityTasks}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

async function main() {
  try {
    await applyMigration()
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