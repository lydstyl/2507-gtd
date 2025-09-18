// Script to check dates stored in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDates() {
  console.log('=== DATABASE DATE CHECK ===\n');

  try {
    // Get all tasks with due dates
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        dueDate: true,
        createdAt: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    console.log(`Found ${tasks.length} tasks with due dates:\n`);

    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.name}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Due Date (raw): ${task.dueDate}`);
      console.log(`   Due Date (ISO): ${task.dueDate?.toISOString()}`);
      console.log(`   Created: ${task.createdAt?.toISOString()}`);
      console.log('');
    });

    // Test date parsing
    console.log('=== DATE PARSING TEST ===');
    const testDate = new Date('2025-09-20');
    console.log(`new Date('2025-09-20'): ${testDate}`);
    console.log(`toISOString(): ${testDate.toISOString()}`);

    const utcDate = new Date(Date.UTC(testDate.getFullYear(), testDate.getMonth(), testDate.getDate()));
    console.log(`UTC normalized: ${utcDate}`);
    console.log(`UTC ISO: ${utcDate.toISOString()}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDates();