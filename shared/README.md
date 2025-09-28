# @gtd/shared - Shared Domain Package

This package contains all shared business logic, domain types, validation rules, and constants used by both the frontend and backend applications.

## Overview

The shared domain package eliminates code duplication by centralizing all business logic in a single package. This ensures consistency between frontend and backend while maintaining type safety and reducing maintenance burden.

**Benefits:**
- ✅ 770+ lines of duplication eliminated
- ✅ Single source of truth for business logic
- ✅ Type safety with shared interfaces
- ✅ Consistent validation between frontend and backend
- ✅ Unified business rules and constants

## Installation

The shared package is automatically installed as a workspace dependency:

```bash
# Install all workspace dependencies
npm run install:all

# Build the shared package
npm run build:shared

# Test the shared package
npm run test:shared
```

## Package Structure

```
shared/src/
├── domain/
│   ├── entities/
│   │   ├── TaskTypes.ts          # Core task interfaces & types
│   │   ├── TagTypes.ts           # Tag interfaces & types
│   │   ├── TaskEntity.ts         # Task business logic
│   │   ├── TagEntity.ts          # Tag business logic
│   │   └── UserEntity.ts         # User business logic
│   ├── services/
│   │   ├── TaskPriorityService.ts    # Task sorting & priority logic
│   │   ├── TaskCategoryService.ts    # Task categorization logic
│   │   ├── TaskValidationService.ts  # Task validation rules
│   │   ├── TagValidationService.ts   # Tag validation logic
│   │   ├── TaskSortingService.ts     # Task sorting algorithms
│   │   └── CsvService.ts             # CSV parsing & formatting
│   ├── constants/
│   │   ├── BusinessRules.ts          # Business rules & constants
│   │   └── ValidationRules.ts        # Validation patterns
│   ├── errors/
│   │   └── DomainErrors.ts           # Domain-specific errors
│   └── utils/
│       ├── DateUtils.ts              # Date handling utilities
│       └── TaskDisplayUtils.ts       # Task styling utilities
└── index.ts                          # Public API exports
```

## Usage

### Import from the main package

```typescript
import {
  TaskEntity,
  TagEntity,
  TaskPriorityService,
  TaskValidationService,
  TASK_CONSTANTS,
  ValidationError
} from '@gtd/shared'
```

### Generic Type Strategy

The package uses generic types to handle Date/string differences:

```typescript
// Generic interfaces work with both Date and string types
interface TaskBase<TDate = Date | string> {
  id: string
  name: string
  plannedDate?: TDate
  createdAt: TDate
  // ...
}

// Backend uses Date objects from database
type BackendTask = TaskBase<Date>

// Frontend uses string dates from JSON API
type FrontendTask = TaskBase<string>
```

## Key Components

### Domain Services

#### TaskPriorityService
Handles task sorting and priority calculation:

```typescript
import { TaskPriorityService } from '@gtd/shared'

// Calculate points based on importance and complexity
const points = TaskPriorityService.calculatePoints(importance, complexity)

// Sort tasks by priority
const sortedTasks = TaskPriorityService.sortByPriority(tasks)
```

#### TaskValidationService
Provides comprehensive task validation:

```typescript
import { TaskValidationService } from '@gtd/shared'

// Validate task data
const result = TaskValidationService.validateTaskData({
  name: 'My Task',
  importance: 25,
  complexity: 3
})

if (!result.success) {
  console.error(result.validationErrors)
}
```

#### TagValidationService
Handles tag validation with business rules:

```typescript
import { TagValidationService } from '@gtd/shared'

// Validate tag creation data
const result = TagValidationService.validateCreateData({
  name: 'work',
  color: '#3B82F6',
  userId: 'user123'
})
```

#### TaskCategoryService
Categorizes tasks based on business rules:

```typescript
import { TaskCategoryService } from '@gtd/shared'

// Get task category
const category = TaskCategoryService.getTaskCategory(task, dateContext)
// Returns: 'collected' | 'overdue' | 'today' | 'tomorrow' | 'no-date' | 'future'
```

### Domain Entities

#### TaskEntity
Business logic for individual tasks:

```typescript
import { TaskEntity } from '@gtd/shared'

const taskEntity = new TaskEntity(taskData)

// Business logic methods
const points = taskEntity.calculatePoints()
const category = taskEntity.getCategory(dateContext)
const isOverdue = taskEntity.isOverdue()
const validation = taskEntity.validate()
```

#### TagEntity
Business logic for tags:

```typescript
import { TagEntity } from '@gtd/shared'

const tagEntity = new TagEntity(tagData)

// Business logic methods
const hasColor = tagEntity.hasCustomColor()
const displayColor = tagEntity.getDisplayColor()
const contrastColor = tagEntity.getContrastColor()
const validation = tagEntity.validate()
```

### Business Rules and Constants

#### TASK_CONSTANTS
Core task business rules:

```typescript
import { TASK_CONSTANTS } from '@gtd/shared'

console.log(TASK_CONSTANTS.maxImportance) // 50
console.log(TASK_CONSTANTS.maxComplexity) // 9
console.log(TASK_CONSTANTS.maxPoints) // 500
```

#### TAG_CONSTANTS
Tag validation and business rules:

```typescript
import { TAG_CONSTANTS } from '@gtd/shared'

console.log(TAG_CONSTANTS.nameMaxLength) // 50
console.log(TAG_CONSTANTS.allowedColors) // Array of hex colors
console.log(TAG_CONSTANTS.reservedNames) // ['all', 'none', 'untagged', 'system']
```

### Error Handling

#### Domain Errors
Standardized error classes:

```typescript
import {
  ValidationError,
  TaskValidationError,
  TagValidationError
} from '@gtd/shared'

try {
  // Some operation
} catch (error) {
  if (error instanceof TaskValidationError) {
    console.error('Task validation failed:', error.message)
  }
}
```

## Integration Patterns

### Backend Integration

```typescript
// backend/src/usecases/tasks/CreateTaskUseCase.ts
import { TaskValidationService, TaskPriorityService } from '@gtd/shared'

export class CreateTaskUseCase {
  async execute(data: CreateTaskData): Promise<Task> {
    // Use shared validation
    const validation = TaskValidationService.validateTaskData(data)
    if (!validation.success) {
      throw new Error(validation.validationErrors?.join(', '))
    }

    // Use shared business logic
    const points = TaskPriorityService.calculatePoints(
      data.importance,
      data.complexity
    )

    return await this.taskRepository.create({ ...data, points })
  }
}
```

### Frontend Integration

```typescript
// frontend/src/domain/types/TagTypes.ts
// Re-export shared types with frontend-specific extensions
export * from '@gtd/shared'

// Frontend-specific type extensions
export interface Tag extends FrontendTag {
  position: number // UI ordering
}
```

## Development Guidelines

### Adding New Business Logic

1. **Always check if it belongs in shared package first**
2. **Add to shared package when:**
   - Business rules that apply to both frontend and backend
   - Validation logic
   - Domain calculations
   - Data transformations
   - Core domain types

3. **Keep in local domain when:**
   - Platform-specific extensions
   - UI-specific types
   - Infrastructure concerns

### Testing

Write comprehensive tests for all shared domain logic:

```typescript
// shared/src/domain/__tests__/services/TaskValidationService.test.ts
describe('TaskValidationService', () => {
  it('should validate task importance', () => {
    const result = TaskValidationService.validateImportance(25)
    expect(result).toBe(true)
  })
})
```

### Type Safety

Use the generic type system for cross-platform compatibility:

```typescript
// Define generic service
export class MyDomainService {
  static processTask<TDate>(task: TaskBase<TDate>): TaskBase<TDate> {
    // Business logic that works with both Date and string dates
    return task
  }
}

// Backend usage
const backendTask: BackendTask = MyDomainService.processTask(prismaTask)

// Frontend usage
const frontendTask: FrontendTask = MyDomainService.processTask(apiTask)
```

## Building and Testing

### Build Commands

```bash
# Build shared package
npm run build:shared

# Build all packages (shared first)
npm run build

# Watch mode for development
cd shared && npm run build:watch
```

### Test Commands

```bash
# Test shared package only
npm run test:shared

# Test all packages (including shared)
npm run test:all

# Watch mode for development
cd shared && npm run test:watch
```

### CI/CD Integration

The shared package is built first in the CI/CD pipeline:

```bash
npm run build  # Builds: shared → backend → frontend
npm run test   # Tests: shared → backend → frontend
```

## Migration Guide

### Moving Logic to Shared Package

1. **Identify duplicated business logic** between frontend and backend
2. **Create generic version** in shared package
3. **Add comprehensive tests** for the shared logic
4. **Update frontend and backend** to use shared version
5. **Remove duplicated code** from local packages
6. **Verify all tests pass**

### Example Migration

Before (duplicated):
```typescript
// backend/src/domain/TaskUtils.ts
export function calculatePoints(importance: number, complexity: number) {
  return importance * complexity * 10
}

// frontend/src/utils/taskUtils.ts
export function calculatePoints(importance: number, complexity: number) {
  return importance * complexity * 10  // Same logic duplicated!
}
```

After (shared):
```typescript
// shared/src/domain/services/TaskPriorityService.ts
export class TaskPriorityService {
  static calculatePoints(importance: number, complexity: number): number {
    return importance * complexity * 10
  }
}

// backend/src/usecases/CreateTaskUseCase.ts
import { TaskPriorityService } from '@gtd/shared'
const points = TaskPriorityService.calculatePoints(importance, complexity)

// frontend/src/components/TaskForm.tsx
import { TaskPriorityService } from '@gtd/shared'
const points = TaskPriorityService.calculatePoints(importance, complexity)
```

## Troubleshooting

### Build Issues

If you encounter build issues:

1. **Clean and rebuild**:
   ```bash
   rm -rf shared/dist
   npm run build:shared
   ```

2. **Check imports**: Make sure you're importing from `@gtd/shared`, not relative paths

3. **Verify workspace setup**: Ensure shared package is listed in root package.json workspaces

### Type Issues

If TypeScript can't find shared types:

1. **Rebuild shared package**: `npm run build:shared`
2. **Check tsconfig**: Ensure proper module resolution
3. **Restart TypeScript server** in your IDE

### Test Issues

If shared package tests fail:

1. **Check test imports**: Use `@gtd/shared` imports in tests
2. **Verify test data**: Ensure test data matches shared interfaces
3. **Run tests in isolation**: `cd shared && npm test`

---

For more information, see the main [CLAUDE.md](../CLAUDE.md) documentation.