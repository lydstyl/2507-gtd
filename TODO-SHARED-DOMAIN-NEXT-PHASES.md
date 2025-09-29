# GTD Shared Domain - Remaining Phases TODO

This document outlines the remaining work for the shared domain package refactoring project.

## 📋 Current Status

**Completed Phases (1-12):**
- ✅ Phases 1-11: Core shared domain package with 770+ lines eliminated
- ✅ Phase 12: Shared use case architecture with ~150-200 lines eliminated
- ✅ **Total Impact**: ~920-970 lines of duplication eliminated

**Remaining Work:**
- 🔧 Unit test interface updates (Phase 12 cleanup)
- 🚀 Phase 13: Repository Interface Harmonization
- 🚀 Phase 14: Advanced Shared Patterns

---

## 🔧 Phase 12 Cleanup: Unit Test Interface Updates

### Priority: Medium (Non-blocking)
**Estimated Impact**: Maintenance task, no additional deduplication

### Backend Tests to Fix

#### CreateTaskUseCase.test.ts
- [ ] Fix test assertions to handle `OperationResult<CreateTaskResponse>` interface
- [ ] Update successful test cases: `expect(result.data!.property)` instead of `expect(result.property)`
- [ ] Update validation test cases: `expect(result.success).toBe(false)` instead of `expectToThrowAsync()`
- [ ] Update error message assertions: `expect(result.error?.message).toContain(...)`

#### UpdateTaskUseCase.test.ts
- [ ] Fix test assertions for new `OperationResult<UpdateTaskResponse>` interface
- [ ] Update controller integration tests for new request/response format
- [ ] Fix validation test patterns

#### CreateTagUseCase.test.ts
- [ ] Fix test assertions for new `OperationResult<CreateTagResponse>` interface
- [ ] Update tag validation test patterns

### Frontend Tests to Fix
- [ ] Update any frontend use case tests that may be affected
- [ ] Verify shared validation integration tests

### Test Pattern Examples

**Before (old pattern):**
```typescript
const result = await createTaskUseCase.execute(taskData)
expect(result.name).toBe('Test Task')
expect(result.importance).toBe(30)
```

**After (new pattern):**
```typescript
const result = await createTaskUseCase.execute(taskData)
expect(result.success).toBe(true)
expect(result.data!.name).toBe('Test Task')
expect(result.data!.importance).toBe(30)
```

**Validation Tests Before:**
```typescript
await expectToThrowAsync(
  () => createTaskUseCase.execute(invalidData),
  'Task name is required'
)
```

**Validation Tests After:**
```typescript
const result = await createTaskUseCase.execute(invalidData)
expect(result.success).toBe(false)
expect(result.error?.message).toContain('Task name is required')
```

---

## 🚀 Phase 13: Repository Interface Harmonization

### Priority: High
**Estimated Impact**: 50-80 lines of deduplication

### Goals
- Unify repository interface patterns between frontend and backend
- Create shared repository base types and query patterns
- Eliminate duplicated repository method signatures

### Tasks

#### 1. Analyze Repository Interfaces
- [ ] **Compare frontend vs backend repository interfaces**
  - `TaskRepository` method signatures and naming conventions
  - `TagRepository` interface differences
  - Query parameter patterns
  - Return type inconsistencies

#### 2. Create Shared Repository Types
- [ ] **Create `/home/gab/apps/2507-gtd/shared/src/domain/repositories/`**
  - `BaseRepository.ts` - Common repository interface patterns
  - `RepositoryTypes.ts` - Shared query/filter types
  - `TaskRepositoryContract.ts` - Unified task repository interface
  - `TagRepositoryContract.ts` - Unified tag repository interface

#### 3. Shared Query/Filter Types
- [ ] **Create standardized query patterns**
  - `QueryOptions` interface (pagination, sorting, filtering)
  - `TaskFilters` type (status, tags, dates, priority)
  - `SearchCriteria` interface for text search
  - `SortOptions` type for consistent sorting

#### 4. Update Backend Repositories
- [ ] **Extend shared repository contracts**
  - Update `backend/src/interfaces/repositories/TaskRepository.ts`
  - Update `backend/src/interfaces/repositories/TagRepository.ts`
  - Align method names (e.g., `findById` vs `getById`)

#### 5. Update Frontend Repositories
- [ ] **Align with shared contracts**
  - Update `frontend/src/interfaces/repositories/TaskRepository.ts`
  - Update `frontend/src/interfaces/repositories/TagRepository.ts`
  - Standardize query parameter patterns

#### 6. Export from Shared Package
- [ ] **Update shared package exports**
  - Add repository types to `shared/src/index.ts`
  - Create repository documentation

### Example Harmonization

**Before (Different Interfaces):**
```typescript
// Backend
interface TaskRepository {
  findById(id: string): Promise<Task | null>
  findAll(userId: string): Promise<Task[]>
}

// Frontend
interface TaskRepository {
  getById(id: string): Promise<Task>
  getAll(userId: string, filters?: any): Promise<Task[]>
}
```

**After (Shared Interface):**
```typescript
// Shared
interface TaskRepositoryContract<TTask> {
  findById(id: string): Promise<TTask | null>
  findAll(userId: string, options?: QueryOptions): Promise<TTask[]>
  search(criteria: SearchCriteria, options?: QueryOptions): Promise<TTask[]>
}

// Both extend the same contract
interface BackendTaskRepository extends TaskRepositoryContract<BackendTask> {}
interface FrontendTaskRepository extends TaskRepositoryContract<FrontendTask> {}
```

---

## 🚀 Phase 14: Advanced Shared Patterns

### Priority: Medium
**Estimated Impact**: 50-100 lines of deduplication

### Goals
- Create advanced shared utilities and patterns
- Implement cross-cutting concerns (logging, caching, metrics)
- Add shared business workflow patterns

### Tasks

#### 1. Shared Utility Patterns
- [ ] **Create advanced shared utilities**
  - `PaginationUtils.ts` - Pagination calculations and types
  - `SortingUtils.ts` - Multi-field sorting logic
  - `FilterUtils.ts` - Complex filtering operations
  - `SearchUtils.ts` - Text search and highlighting

#### 2. Shared Business Workflows
- [ ] **Extract complex business workflows**
  - `TaskWorkflowService.ts` - Task lifecycle management
  - `BulkOperationService.ts` - Bulk task/tag operations
  - `ImportExportService.ts` - Enhanced CSV operations
  - `TaskRelationshipService.ts` - Parent/child relationships

#### 3. Cross-Cutting Concerns
- [ ] **Add shared infrastructure patterns**
  - `Logger.ts` - Structured logging interface
  - `CacheService.ts` - Caching strategy patterns
  - `MetricsCollector.ts` - Performance and usage metrics
  - `EventBus.ts` - Domain event patterns

#### 4. Performance Optimizations
- [ ] **Shared performance utilities**
  - `BatchProcessor.ts` - Batching operations
  - `LazyLoader.ts` - Lazy loading patterns
  - `MemoryOptimizer.ts` - Memory management utilities
  - `QueryOptimizer.ts` - Query optimization hints

#### 5. Enhanced Validation Patterns
- [ ] **Advanced validation utilities**
  - `ConditionalValidator.ts` - Context-dependent validation
  - `AsyncValidator.ts` - Async validation patterns
  - `ValidationComposer.ts` - Composable validation rules
  - `CustomValidators.ts` - Domain-specific validators

### Example Advanced Patterns

**Bulk Operations Service:**
```typescript
export class BulkOperationService {
  static async bulkUpdateTasks(
    tasks: TaskEntity[],
    updates: Partial<TaskBase>,
    options: BulkOptions = {}
  ): Promise<OperationResult<BulkUpdateResult>> {
    // Shared logic for bulk operations
  }
}
```

**Task Workflow Service:**
```typescript
export class TaskWorkflowService {
  static async completeTask(
    task: TaskEntity,
    completionData: TaskCompletionData
  ): Promise<OperationResult<TaskEntity>> {
    // Shared business workflow logic
  }
}
```

---

## 📊 Project Impact Summary

### Completed Deduplication (Phases 1-12)
- **Core Domain Package**: 770+ lines (Phases 1-11)
- **Shared Use Case Architecture**: 150-200 lines (Phase 12)
- **Current Total**: ~920-970 lines eliminated

### Projected Additional Impact
- **Phase 13 (Repository Harmonization)**: 50-80 lines
- **Phase 14 (Advanced Patterns)**: 50-100 lines
- **Final Total**: ~1,020-1,150 lines eliminated

### Benefits Achieved
- ✅ Single source of truth for business logic
- ✅ Consistent validation across platforms
- ✅ Unified error handling patterns
- ✅ Type safety with shared interfaces
- ✅ Reduced maintenance burden
- ✅ Improved code consistency
- ✅ Better testability and reusability

---

## 🎯 Implementation Strategy

### Phase 13: Repository Harmonization (Next Priority)
1. **Week 1**: Interface analysis and shared type creation
2. **Week 2**: Backend repository updates
3. **Week 3**: Frontend repository alignment
4. **Week 4**: Testing and integration

### Phase 14: Advanced Patterns (Future)
1. **Month 1**: Utility patterns and workflows
2. **Month 2**: Cross-cutting concerns
3. **Month 3**: Performance optimizations
4. **Month 4**: Enhanced validation and final integration

### Unit Test Cleanup (Ongoing)
- Can be done incrementally alongside other development
- Non-blocking for new feature development
- Good for junior developer onboarding tasks

---

## 🔧 Maintenance Notes

### Shared Package Dependencies
- Keep shared package lightweight and focused
- Avoid circular dependencies between packages
- Regular dependency audits and updates

### Version Management
- Use semantic versioning for shared package
- Coordinate updates between frontend and backend
- Maintain backward compatibility when possible

### Documentation
- Keep shared package documentation up to date
- Document migration guides for breaking changes
- Maintain architecture decision records (ADRs)

---

*This document should be updated as phases are completed and new requirements emerge.*