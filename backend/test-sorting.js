// Test script to check date sorting logic
console.log('=== DATE SORTING DIAGNOSTIC ===\n');

// Test current date handling
const now = new Date();
console.log('Current time:', now);
console.log('Current UTC:', now.toISOString());

const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
const dayAfterTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 2));

console.log('\nComparison dates (UTC):');
console.log('Today:', today);
console.log('Tomorrow:', tomorrow);
console.log('Day after tomorrow:', dayAfterTomorrow);

// Test date parsing
function parseAndNormalizeDate(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return normalizedDate;
}

console.log('\nDate parsing tests:');
const testDates = ['2025-09-19', '2025-09-20', '2025-09-21', '2025-09-22'];
testDates.forEach(dateStr => {
  const parsed = parseAndNormalizeDate(dateStr);
  const isToday = parsed.getTime() === today.getTime();
  const isTomorrow = parsed.getTime() === tomorrow.getTime();
  const isFuture = parsed >= dayAfterTomorrow;
  console.log(`${dateStr} -> ${parsed} | Today: ${isToday} | Tomorrow: ${isTomorrow} | Future: ${isFuture}`);
});

console.log('\n=== END DIAGNOSTIC ===');