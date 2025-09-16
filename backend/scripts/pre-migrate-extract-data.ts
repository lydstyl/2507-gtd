#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

/**
 * Extract existing task data before schema migration
 */
async function extractTaskData() {
  console.log('📊 Extracting existing task data before migration...')

  try {
    // Get all tasks with old schema using raw SQL
    const tasks = await prisma.$queryRaw`
      SELECT id, name, importance, urgency, priority, createdAt
      FROM tasks
    ` as Array<{
      id: string,
      name: string,
      importance: number,
      urgency: number,
      priority: number,
      createdAt: Date
    }>

    console.log(`✅ Found ${tasks.length} tasks to migrate`)

    // Save to JSON file for migration
    const dataPath = path.join(__dirname, 'task-migration-data.json')
    fs.writeFileSync(dataPath, JSON.stringify(tasks, null, 2))

    console.log(`💾 Saved task data to ${dataPath}`)

    // Show some examples
    console.log('\n📋 Sample tasks to migrate:')
    for (const task of tasks.slice(0, 5)) {
      console.log(`  ${task.name}: (${task.importance},${task.urgency},${task.priority})`)
    }

    return tasks
  } catch (error) {
    console.error('❌ Failed to extract task data:', error)
    throw error
  }
}

async function main() {
  try {
    await extractTaskData()
    console.log('\n✅ Data extraction complete! You can now run the schema migration.')
  } catch (error) {
    console.error('❌ Data extraction failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}