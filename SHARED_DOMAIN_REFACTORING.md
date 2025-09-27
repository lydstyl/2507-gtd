# Shared Domain Package Refactoring Plan

## Overview
Eliminate code duplication between backend and frontend by creating a shared domain package containing all business logic.

## Current Problem
- **640+ lines** of duplicated business logic across multiple areas:
  - **Task Priority Service**: ~200 lines (✅ COMPLETED)
  - **Task Utilities & Business Logic**: ~100 lines
  - **Business Constants & Rules**: ~80 lines
  - **CSV Import/Export Logic**: ~150 lines
  - **Domain Error Classes**: ~50 lines
  - **Tag Domain Types**: ~60 lines
- Duplicated entity interfaces with slight type differences
- Risk of inconsistent behavior between backend/frontend
- Higher maintenance burden
- Scattered business rules across different files

## Solution: Monorepo Shared Package

### Package Structure
```
shared/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── TaskTypes.ts     # Generic task interfaces & types (✅)
│   │   │   └── TagTypes.ts      # Tag interfaces & types
│   │   ├── services/
│   │   │   ├── TaskPriorityService.ts    # Task sorting & priority logic (✅)
│   │   │   ├── TaskCategoryService.ts    # Task categorization logic
│   │   │   ├── TaskValidationService.ts  # Task validation rules
│   │   │   ├── TagValidationService.ts   # Tag validation logic
│   │   │   └── CsvService.ts            # CSV parsing & formatting
│   │   ├── constants/
│   │   │   ├── BusinessRules.ts         # Business rules & constants
│   │   │   └── ValidationRules.ts       # Validation patterns
│   │   ├── errors/
│   │   │   └── DomainErrors.ts          # Domain-specific errors
│   │   └── utils/
│   │       ├── DateUtils.ts             # Date handling utilities (✅)
│   │       └── TaskDisplayUtils.ts      # Task styling utilities
│   └── index.ts                         # Public API exports
├── package.json
├── tsconfig.json
└── __tests__/                           # Shared domain tests
```

## Implementation Checklist

### Phase 1: Setup Shared Package
- [x] Create `shared/` directory in monorepo root
- [x] Initialize `shared/package.json` with proper workspace configuration
- [x] Setup `shared/tsconfig.json` for TypeScript compilation
- [x] Add shared package to root workspace configuration
- [x] Configure build scripts for shared package

### Phase 2: Extract Pure Domain Logic
- [x] Create generic Task interfaces that work with both Date and string types
- [x] Extract TaskPriorityService with generic type parameters
- [x] Create DateUtils for handling Date/string conversion
- [x] Define TaskCategory and other shared types
- [x] Create adapter interfaces for backend/frontend consumption

### Phase 3: Update Backend Integration
- [x] Install shared package as dependency in backend
- [x] Create backend-specific adapters for Prisma Date types
- [x] Update backend TaskSorting to use shared domain service
- [x] Remove duplicated TaskPriorityService from backend
- [x] Update backend tests to use shared package
- [x] Verify all backend tests still pass

### Phase 4: Update Frontend Integration
- [x] Install shared package as dependency in frontend
- [x] Create frontend-specific adapters for string dates from API
- [x] Update frontend TaskSortingService to use shared domain service
- [x] Remove duplicated TaskPriorityService from frontend
- [x] Update TaskEntity to use shared domain service
- [x] Update frontend services index exports

### Phase 5: Testing & Validation
- [ ] Move domain tests to shared package
- [ ] Create comprehensive test suite for shared domain logic
- [ ] Run all backend tests to ensure compatibility
- [ ] Run all frontend tests to ensure compatibility
- [ ] Test both backend and frontend builds
- [ ] Verify application functionality end-to-end

### Phase 6: Task Utilities & Business Logic (~100 lines)
- [ ] Extract task categorization logic from frontend/backend utils
- [ ] Move task category detection to shared TaskCategoryService
- [ ] Create shared TaskValidationService for points calculation
- [ ] Move task display utilities to shared package (frontend adapter)
- [ ] Update both apps to use shared task utilities
- [ ] Remove duplicated utility functions

### Phase 7: Business Constants & Rules (~80 lines)
- [ ] Consolidate business constants from frontend BusinessConstants.ts
- [ ] Extract hardcoded constants from backend services
- [ ] Create shared BusinessRules.ts with all validation rules
- [ ] Create shared ValidationRules.ts with patterns
- [ ] Update both apps to import from shared constants
- [ ] Remove duplicated constants and rules

### Phase 8: CSV Import/Export Logic (~150 lines)
- [ ] Extract pure CSV parsing logic from backend CsvService
- [ ] Create shared CsvService with platform-agnostic logic
- [ ] Create backend adapter for file I/O operations
- [ ] Create frontend adapter for browser download/upload
- [ ] Update both apps to use shared CSV logic
- [ ] Remove duplicated CSV processing code

### Phase 9: Domain Error Classes (~50 lines)
- [ ] Move domain-specific errors to shared package
- [ ] Create shared DomainErrors.ts with validation errors
- [ ] Keep infrastructure errors in backend
- [ ] Keep UI-specific errors in frontend
- [ ] Update both apps to use shared domain errors
- [ ] Ensure consistent error handling patterns

### Phase 10: Tag Domain Types (~60 lines)
- [ ] Consolidate tag types from frontend/backend
- [ ] Move tag validation logic to shared TagValidationService
- [ ] Create shared TagTypes.ts with all tag interfaces
- [ ] Update both apps to use shared tag domain
- [ ] Remove duplicated tag type definitions
- [ ] Ensure consistent tag business rules

### Phase 11: Final Cleanup & Documentation
- [ ] Remove all remaining duplicated domain files
- [ ] Update CLAUDE.md with comprehensive shared package information
- [ ] Update package.json scripts for shared package builds
- [ ] Document shared package usage for future development
- [ ] Update Clean Architecture documentation
- [ ] Create migration guide for future developers

## Benefits Expected
✅ **Single Source of Truth**: All business rules in one place
✅ **Zero Duplication**: Eliminate ~640 lines of duplicated code
✅ **Type Safety**: Shared types ensure consistency
✅ **Better Testing**: Single test suite for business logic
✅ **Easier Maintenance**: Changes in one place affect both apps
✅ **Consistent Behavior**: Guaranteed identical logic between frontend/backend
✅ **Unified Business Rules**: All validation and constants centralized
✅ **Improved Architecture**: Clear separation of domain vs. infrastructure concerns

## Technical Approach

### Generic Type Strategy
```typescript
// Shared domain with generic date handling
interface TaskBase<TDate = Date | string> {
  id: string
  name: string
  plannedDate?: TDate
  dueDate?: TDate
  // ... other properties
}

// Backend uses Date objects
type BackendTask = TaskBase<Date>

// Frontend uses string dates
type FrontendTask = TaskBase<string>
```

### Adapter Pattern
```typescript
// Backend adapter
class BackendTaskAdapter {
  static toGeneric(task: PrismaTask): GenericTask<Date> { ... }
}

// Frontend adapter
class FrontendTaskAdapter {
  static toGeneric(task: ApiTask): GenericTask<string> { ... }
}
```

## Implementation Notes
- Use npm workspaces for package management
- Shared package will be `@gtd/shared` internally
- Build shared package before backend/frontend in CI/CD
- Maintain backward compatibility during transition

## Progress Tracking
- **Started**: September 26, 2025
- **Estimated Completion**: TBD
- **Current Phase**: Phase 4 Complete - Ready for Phase 5 (Testing & Validation)
- **Expanded Scope**: Additional 440 lines of duplication identified
- **Total Impact**: 640+ lines of duplicated code to eliminate

## Completed Work
✅ **Shared Package Created**: `@gtd/shared` package with proper workspace setup
✅ **Generic Domain Types**: TaskBase, TaskWithSubtasks with generic date handling
✅ **Pure Business Logic**: TaskPriorityService extracted with full sorting algorithm
✅ **Date Utilities**: Unified date handling for both Date objects and strings
✅ **Build System**: TypeScript compilation and workspace integration working
✅ **Backend Integration Complete**: Backend now uses shared domain service, eliminating ~200 lines of duplicated code
✅ **Backend Adapters**: Created TaskAdapter for type conversion between Prisma and shared domain types
✅ **Backend Tests Updated**: All backend tests passing with shared package integration
✅ **Frontend Integration Complete**: Frontend now uses shared domain service, eliminating ~200 lines of duplicated code
✅ **Frontend Adapters**: TaskAdapter handles conversion between API string dates and shared domain types
✅ **UI Services Separated**: Created TaskPriorityUIService for presentation logic, shared package contains only business logic
✅ **Frontend Tests Updated**: All frontend tests passing with shared package integration

## Additional Duplication Identified

### Task Utilities & Business Logic (~100 lines)
**Files**:
- `frontend/src/utils/taskUtils.ts` (246 lines)
- `backend/src/domain/utils/TaskUtils.ts` (44 lines)

**Duplicated Logic**:
- Task categorization (`getTaskCategory`)
- Points calculation and validation
- Date formatting and comparison
- Task priority styling

### Business Constants & Rules (~80 lines)
**Files**:
- `frontend/src/domain/types/BusinessConstants.ts` (140 lines)
- Backend hardcoded constants in various services

**Duplicated Logic**:
- Task/Tag business rules
- Priority and complexity mappings
- Validation patterns
- Feature flags

### CSV Import/Export Logic (~150 lines)
**Files**:
- `backend/src/application/services/CsvService.ts` (215 lines)
- Frontend CSV parsing in components

**Duplicated Logic**:
- CSV field mapping and validation
- Import/export data transformation
- Error handling for CSV operations

### Domain Error Classes (~50 lines)
**Files**:
- `backend/src/shared/errors/DomainError.ts`
- Frontend inconsistent error handling

**Duplicated Logic**:
- Validation error types
- Domain-specific error messages
- Error categorization

### Tag Domain Types (~60 lines)
**Files**:
- `frontend/src/domain/types/TagTypes.ts` (104 lines)
- `backend/src/domain/entities/Tag.ts` (27 lines)

**Duplicated Logic**:
- Tag filtering and sorting interfaces
- Tag analytics types
- Tag business rules