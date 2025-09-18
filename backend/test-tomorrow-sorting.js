// Test script to check if tomorrow tasks are sorted correctly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTomorrowSorting() {
  console.log('=== TOMORROW SORTING TEST ===\n');

  try {
    // Create a test task for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('Tomorrow date:', tomorrowStr);

    const testTask = await prisma.task.create({
      data: {
        name: 'TEST_TOMORROW_TASK_' + Date.now(),
        importance: 30,
        complexity: 2,
        dueDate: tomorrowStr, // Send as YYYY-MM-DD string
        userId: 'test-user-id', // You'll need to replace this with a real user ID
        points: 150
      }
    });

    console.log('Created test task:', {
      id: testTask.id,
      name: testTask.name,
      dueDate: testTask.dueDate,
      points: testTask.points
    });

    // Get all tasks sorted
    const allTasks = await prisma.task.findMany({
      where: {
        userId: 'test-user-id' // Replace with real user ID
      },
      orderBy: {
        // We'll test the sorting logic manually
        createdAt: 'desc'
      }
    });

    console.log('\nAll tasks for user:');
    allTasks.forEach((task, index) => {
      const dueDateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'no-date';
      console.log(`${index + 1}. ${task.name} - Due: ${dueDateStr} - Points: ${task.points}`);
    });

    // Clean up
    await prisma.task.delete({
      where: { id: testTask.id }
    });

    console.log('\nTest task cleaned up.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTomorrowSorting();