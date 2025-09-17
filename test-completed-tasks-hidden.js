// Test to verify completed tasks are hidden from task list
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCompletedTasksHidden() {
  try {
    console.log('🧪 Testing: Completed tasks are hidden from task list');

    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;

    // Create a new task
    const taskResponse = await axios.post(`${BASE_URL}/tasks`, {
      name: 'Test Task - Should Be Hidden When Completed',
      importance: 5,
      complexity: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const task = taskResponse.data;
    console.log('✅ Created test task:', task.name);

    // Check initial task list - should include the new task
    const initialTasks = await axios.get(`${BASE_URL}/tasks/root`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const taskFound = initialTasks.data.find(t => t.id === task.id);

    if (taskFound && !taskFound.isCompleted) {
      console.log('✅ Task appears in initial task list (as expected)');
    } else {
      console.log('❌ Task not found in initial task list');
      return;
    }

    // Mark the task as completed
    await axios.post(`${BASE_URL}/tasks/${task.id}/complete`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Task marked as completed');

    // Check task list after completion - task should be hidden
    const finalTasks = await axios.get(`${BASE_URL}/tasks/root`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const completedTaskFound = finalTasks.data.find(t => t.id === task.id);

    if (!completedTaskFound) {
      console.log('🎉 SUCCESS: Completed task is hidden from task list!');
    } else {
      console.log('❌ FAILED: Completed task is still visible in task list');
    }

    // Verify the task still exists in completion stats
    const stats = await axios.get(`${BASE_URL}/tasks/completed/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.data.dailyCompletions.find(d => d.date === today);
    const taskInStats = todayStats?.tasks.find(t => t.id === task.id);

    if (taskInStats) {
      console.log('✅ Completed task appears in completion statistics');
    } else {
      console.log('⚠️ Completed task not found in completion statistics');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompletedTasksHidden();