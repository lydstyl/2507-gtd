// Simple test to verify new defaults work correctly
const { TaskPriorityService } = require('./frontend/src/domain/services/TaskPriorityService.ts');

// Test the new defaults: importance = 0, complexity = 3
const importance = 0;
const complexity = 3;

// Calculate points with new defaults
const points = Math.round(10 * importance / complexity);
console.log('✅ New task defaults:');
console.log(`   Importance: ${importance}`);
console.log(`   Complexity: ${complexity}`);
console.log(`   Points: ${points}`);

// Test if it would be considered "collected"
const isNewDefaultTask = importance === 0 && complexity === 3;
console.log(`   Would be "collected": ${isNewDefaultTask}`);

// Test a high priority task for comparison
const highImportance = 50;
const highComplexity = 1;
const highPoints = Math.round(10 * highImportance / highComplexity);
const isHighPriorityTask = highPoints >= 500;
console.log('\n✅ Old high priority task:');
console.log(`   Importance: ${highImportance}`);
console.log(`   Complexity: ${highComplexity}`);
console.log(`   Points: ${highPoints}`);
console.log(`   Would be "collected": ${isHighPriorityTask}`);