# GTD Application - Domain & Use Cases Test Coverage Plan

## Executive Summary

This plan outlines the strategy to achieve 80% test coverage for the domain and use cases layers across both frontend and backend of the GTD application. Based on the analysis of the current codebase, we need to implement comprehensive testing for business logic, domain services, entities, and use cases.

## Current State Analysis

### Existing Test Coverage

**Backend Tests:**
- ✅ `TaskPriorityService` - Comprehensive domain service tests (248 lines)
- ✅ Multiple integration tests for task sorting (224 total tests)
- ✅ End-to-end tests for tasks, tags, and subtasks
- ✅ Entity tests (Task, User, Tag)
- ✅ TaskUtils tests
- ❌ **Missing**: Use case tests

**Frontend Tests:**
- ✅ **Completed**: All domain layer tests (TaskEntity, TaskPriorityService, TaskCategoryService, TaskSortingService, TaskSortingPriorityService)
- ✅ **Completed**: Advanced edge cases and business rules integration tests
- ✅ **Completed**: Cross-platform consistency validation tests
- ✅ **Completed**: 250 tests passing with good domain service coverage (71.83%)
- ❌ **Missing**: Use case tests

### Domain & Use Cases Inventory

**Backend Domain Layer:**
1. **Entities**: `Task.ts`, `User.ts`, `Tag.ts`
2. **Services**: `TaskPriorityService.ts` ✅ (tested)
3. **Utils**: `TaskUtils.ts` ❌ (not tested)

**Frontend Domain Layer:**
1. **Entities**: `Task.ts` (TaskEntity class), `Tag.ts`, `User.ts`
2. **Services**:
   - `TaskPriorityService.ts` ❌
   - `TaskCategoryService.ts` ❌
   - `TaskSortingService.ts` ❌
   - `TaskSortingPriorityService.ts` ❌
   - `DateService.ts` ❌

**Shared Domain Layer:**
1. **Services**: `TaskPriorityService.ts` ❌
2. **Utils**: `DateUtils.ts` ❌
3. **Types**: `TaskTypes.ts`, Business constants ❌

**Backend Use Cases:**
- Tasks: `CreateTaskUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase`, `GetTaskUseCase`, `GetAllTasksUseCase`, `MarkTaskAsCompletedUseCase`, `WorkedOnTaskUseCase`, `ExportTasksUseCase`, `ImportTasksUseCase`, `GetCompletionStatsUseCase`, `GetCompletedTasksUseCase`
- Tags: `CreateTagUseCase`, `UpdateTagUseCase`, `DeleteTagUseCase`, `GetAllTagsUseCase`, `UpdateTagPositionsUseCase`
- Cleanup: `CleanupOldCompletedTasksUseCase`

**Frontend Use Cases:**
- Tasks: `CreateTaskUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase`, `GetTasksUseCase`, `GetTaskByIdUseCase`, `WorkedOnTaskUseCase`
- Tags: `CreateTagUseCase`, `UpdateTagUseCase`, `DeleteTagUseCase`, `GetTagsUseCase`

## Test Coverage Goals

### Priority 1: Core Business Logic (Week 1-2)
- **Target**: 90% coverage for domain services and entities
- **Focus**: Business rules, calculations, validations

### Priority 2: Use Cases (Week 3-4)
- **Target**: 80% coverage for all use cases
- **Focus**: Business workflows, error handling, edge cases

### Priority 3: Shared Domain (Week 5)
- **Target**: 85% coverage for shared domain utilities
- **Focus**: Cross-platform business logic consistency

## Detailed Implementation Plan

### Phase 1: Domain Layer Tests

#### 1.1 Backend Domain Tests

**File**: `backend/__tests__/domain/TaskUtils.test.ts`
- `computePoints()` - Formula validation, edge cases, input sanitization
- `validateImportance()` - Boundary testing (0-50)
- `validateComplexity()` - Boundary testing (1-9)
- `getDefaultTaskValues()` - Default value consistency

**File**: `backend/__tests__/domain/entities/Task.test.ts`
- Task entity creation and validation
- Business rule enforcement
- Date handling and timezone normalization

**File**: `backend/__tests__/domain/entities/User.test.ts`
- User entity validation
- Security constraints

**File**: `backend/__tests__/domain/entities/Tag.test.ts`
- Tag entity validation
- Color validation
- Name constraints

#### 1.2 Frontend Domain Tests ✅ COMPLETED

**File**: `frontend/src/domain/__tests__/entities/TaskEntity.test.ts` ✅
- ✅ `calculatePoints()` - Formula validation, edge cases, input sanitization
- ✅ `isOverdue()` - Overdue detection, missing dates, timezone handling
- ✅ `isDueToday()` - Today detection, UTC normalization
- ✅ `getCategory()` - Task categorization (collected, overdue, today, tomorrow, future)
- ✅ `hasSubtasks()` - Subtask detection logic
- ✅ `getSubtaskEntities()` - Subtask entity retrieval
- ✅ `getDayOfWeek()` - Date handling and error cases
- ✅ Date parsing and normalization methods

**File**: `frontend/src/domain/__tests__/services/TaskPriorityService.test.ts` ✅
- ✅ Priority calculations and color mappings
- ✅ Priority score algorithms
- ✅ Task grouping by priority
- ✅ Edge cases and boundary conditions

**File**: `frontend/src/domain/__tests__/services/TaskCategoryService.test.ts` ✅
- ✅ Category style mappings and visual indicators
- ✅ Category statistics and task counting
- ✅ Task filtering by category
- ✅ Active category detection
- ✅ Timer setup for consistent date testing

**File**: `frontend/src/domain/__tests__/services/TaskSortingService.test.ts` ✅
- ✅ Priority-based sorting algorithms
- ✅ Date-based sorting with UTC normalization
- ✅ Name/importance/complexity sorting
- ✅ Subtask sorting within parent tasks
- ✅ Date range filtering and edge cases

**File**: `frontend/src/domain/__tests__/services/TaskSortingPriorityService.test.ts` ✅
- ✅ UTC date normalization for cross-platform consistency
- ✅ Sorting priority logic and business rules
- ✅ Date handling edge cases and error conditions

#### 1.3 Shared Domain Tests

**File**: `shared/src/domain/__tests__/services/TaskPriorityService.test.ts`
- Generic task priority logic
- Cross-platform consistency
- Date/string compatibility

**File**: `shared/src/domain/__tests__/utils/DateUtils.test.ts`
- Date normalization functions
- Urgency detection
- Date context creation
- Cross-platform date handling

### Phase 2: Use Cases Tests

#### 2.1 Backend Use Cases Tests

**Directory**: `backend/__tests__/usecases/`

**Tasks Use Cases:**
```typescript
// CreateTaskUseCase.test.ts
describe('CreateTaskUseCase', () => {
  describe('validation', () => {
    it('should reject invalid task names')
    it('should reject invalid importance/complexity')
    it('should reject invalid dates')
  })

  describe('business rules', () => {
    it('should apply default values')
    it('should calculate points correctly')
    it('should handle parent task validation')
  })

  describe('error handling', () => {
    it('should handle repository failures')
    it('should provide meaningful error messages')
  })
})
```

**Priority Test Files:**
1. `CreateTaskUseCase.test.ts` - Validation, defaults, business rules
2. `UpdateTaskUseCase.test.ts` - Partial updates, validation, state changes
3. `DeleteTaskUseCase.test.ts` - Cascade deletion, authorization
4. `MarkTaskAsCompletedUseCase.test.ts` - Completion logic, timestamps
5. `GetTaskUseCase.test.ts` - Authorization, not found handling
6. `GetAllTasksUseCase.test.ts` - Filtering, sorting, pagination
7. `ExportTasksUseCase.test.ts` - CSV generation, data formatting
8. `ImportTasksUseCase.test.ts` - CSV parsing, validation, conflict resolution

**Tags Use Cases:**
1. `CreateTagUseCase.test.ts` - Validation, uniqueness, color validation
2. `UpdateTagUseCase.test.ts` - Name changes, color updates
3. `DeleteTagUseCase.test.ts` - Task relationship cleanup
4. `UpdateTagPositionsUseCase.test.ts` - Position validation, ordering

#### 2.2 Frontend Use Cases Tests

**Directory**: `frontend/src/usecases/__tests__/`

**Base Use Case Tests:**
```typescript
// base/UseCase.test.ts
describe('BaseUseCase', () => {
  describe('error handling', () => {
    it('should wrap async errors')
    it('should provide operation results')
    it('should handle timeout scenarios')
  })
})
```

**Task Use Cases:**
1. `CreateTaskUseCase.test.ts` - Request validation, business rule application
2. `UpdateTaskUseCase.test.ts` - Partial updates, validation
3. `DeleteTaskUseCase.test.ts` - Confirmation logic
4. `GetTasksUseCase.test.ts` - Filtering, sorting
5. `GetTaskByIdUseCase.test.ts` - Single task retrieval
6. `WorkedOnTaskUseCase.test.ts` - Time tracking logic

### Phase 3: Integration & Edge Cases

#### 3.1 Business Rule Integration Tests

**File**: `backend/__tests__/domain/business-rules-integration.test.ts`
- Cross-service business rule validation
- Complex task categorization scenarios
- Priority calculation edge cases
- Date normalization consistency

#### 3.2 Cross-Layer Consistency Tests

**File**: `frontend/src/domain/__tests__/cross-layer-consistency.test.ts`
- Frontend/backend domain service parity
- Shared domain service integration
- Entity behavior consistency

### Phase 4: Mock Strategy & Test Utilities

#### 4.1 Test Utilities

**File**: `backend/__tests__/utils/test-helpers.ts`
```typescript
export function createMockTask(overrides?: Partial<Task>): Task
export function createMockUser(overrides?: Partial<User>): User
export function createMockTag(overrides?: Partial<Tag>): Tag
export function createDateContext(fixedDate?: Date): DateContext
export function assertTaskCategory(task: Task, expectedCategory: TaskCategory)
```

**File**: `frontend/src/__tests__/utils/test-helpers.ts`
```typescript
export function createMockTaskEntity(overrides?: Partial<Task>): TaskEntity
export function createMockRepository<T>(): MockRepository<T>
export function createMockUseCase<TRequest, TResponse>(): MockUseCase<TRequest, TResponse>
```

#### 4.2 Repository Mocks

**Backend**: Mock Prisma repositories for use case testing
**Frontend**: Mock HTTP repositories for use case testing

## Testing Standards & Best Practices

### Test Structure
```typescript
describe('FeatureName', () => {
  describe('method/functionality', () => {
    it('should handle normal case')
    it('should handle edge case')
    it('should handle error case')
  })
})
```

### Coverage Requirements
- **Functions**: 90% line coverage
- **Branches**: 85% coverage
- **Statements**: 90% coverage
- **Edge Cases**: All boundary conditions tested

### Test Categories
1. **Unit Tests**: Pure business logic, no dependencies
2. **Integration Tests**: Cross-service interactions
3. **Contract Tests**: Interface compliance
4. **Property Tests**: Business rule invariants

## Implementation Timeline

### Week 1: Backend Domain Layer
- [ ] TaskUtils tests (2 days)
- [ ] Entity tests (2 days)
- [ ] Test utilities setup (1 day)

### Week 2: Frontend Domain Layer ✅ COMPLETED
- [x] TaskEntity tests (2 days) ✅
- [x] Service tests (TaskPriorityService, TaskCategoryService) (2 days) ✅
- [x] TaskSortingService tests (1 day) ✅
- [x] TaskSortingPriorityService tests (1 day) ✅
- [x] Advanced edge cases and business rules integration tests ✅
- [x] Cross-platform consistency validation tests ✅

### Week 3: Backend Use Cases
- [ ] Task use cases (CreateTask, UpdateTask, DeleteTask) (2 days)
- [ ] Task use cases (GetTask, GetAllTasks, MarkCompleted) (2 days)
- [ ] Tag use cases (1 day)

### Week 4: Frontend Use Cases
- [ ] Task use cases (Create, Update, Delete, Get) (2 days)
- [ ] Base UseCase and error handling (1 day)
- [ ] Tag use cases (1 day)
- [ ] WorkedOnTask use case (1 day)

### Week 5: Shared Domain & Polish
- [ ] Shared domain service tests (2 days)
- [ ] DateUtils tests (1 day)
- [ ] Cross-layer consistency tests (1 day)
- [ ] Coverage analysis and gap filling (1 day)

## Success Metrics

### Quantitative Goals
- **Domain Layer**: 90% test coverage ✅ (Backend: Good coverage, Frontend: 71.83% for services)
- **Use Cases Layer**: 80% test coverage ❌ (Next priority)
- **Overall**: 80% combined coverage (Current: ~40-50% overall, good domain coverage)
- **Zero** business logic bugs in production

### Qualitative Goals
- All business rules documented through tests
- Edge cases and error scenarios covered
- Cross-platform consistency validated
- Maintainable and readable test suite

## Risk Mitigation

### Technical Risks
1. **Async Testing Complexity**: Use proper async/await patterns and timeouts
2. **Date Testing Issues**: Use fixed date contexts and UTC normalization
3. **Mock Complexity**: Keep mocks simple and focused on behavior

### Process Risks
1. **Time Overrun**: Prioritize core business logic first
2. **Test Maintenance**: Focus on business behavior, not implementation details
3. **Coverage Gaming**: Ensure meaningful tests, not just line coverage

## Tools & Configuration

### Testing Frameworks
- **Backend**: Vitest with TypeScript
- **Frontend**: Vitest with React Testing Library
- **Shared**: Jest for cross-platform compatibility

### Coverage Tools
- **Coverage Reports**: Built-in Vitest coverage
- **Thresholds**: Configure minimum coverage per layer
- **CI Integration**: Fail builds on coverage drops

### Code Quality
- **Linting**: ESLint rules for test quality
- **Type Safety**: Strict TypeScript in tests
- **Documentation**: JSDoc for complex test scenarios

## Conclusion

This comprehensive plan will establish robust test coverage for the domain and use cases layers, ensuring business logic reliability and maintainability. The phased approach allows for iterative improvement while maintaining development velocity.

The focus on business rules and domain logic will provide confidence in the core functionality while enabling safe refactoring and feature development going forward.