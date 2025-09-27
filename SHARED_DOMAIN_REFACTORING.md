# Shared Domain Package Refactoring Plan

## Overview
Eliminate code duplication between backend and frontend by creating a shared domain package containing all business logic.

## Current Problem
- **200+ lines** of duplicated business logic between:
  - `backend/src/domain/services/TaskPriorityService.ts`
  - `frontend/src/domain/services/TaskSortingPriorityService.ts`
- Duplicated entity interfaces with slight type differences
- Risk of inconsistent behavior between backend/frontend
- Higher maintenance burden

## Solution: Monorepo Shared Package

### Package Structure
```
shared/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Task.ts          # Generic task interfaces
│   │   │   ├── Tag.ts           # Tag interfaces
│   │   │   └── TaskTypes.ts     # Shared types & enums
│   │   ├── services/
│   │   │   └── TaskPriorityService.ts  # Pure business logic
│   │   └── utils/
│   │       └── DateUtils.ts     # Date handling utilities
│   └── index.ts                 # Public API exports
├── package.json
├── tsconfig.json
└── __tests__/                   # Shared domain tests
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
- [ ] Install shared package as dependency in frontend
- [ ] Create frontend-specific adapters for string dates from API
- [ ] Update frontend TaskSortingService to use shared domain service
- [ ] Remove duplicated TaskSortingPriorityService from frontend
- [ ] Update TaskEntity to use shared domain service
- [ ] Update frontend services index exports

### Phase 5: Testing & Validation
- [ ] Move domain tests to shared package
- [ ] Create comprehensive test suite for shared domain logic
- [ ] Run all backend tests to ensure compatibility
- [ ] Run all frontend tests to ensure compatibility
- [ ] Test both backend and frontend builds
- [ ] Verify application functionality end-to-end

### Phase 6: Cleanup & Documentation
- [ ] Remove all duplicated domain files
- [ ] Update CLAUDE.md with new shared package information
- [ ] Update package.json scripts for shared package builds
- [ ] Document shared package usage for future development
- [ ] Update Clean Architecture documentation

## Benefits Expected
✅ **Single Source of Truth**: All business rules in one place
✅ **Zero Duplication**: Eliminate ~200 lines of duplicated code
✅ **Type Safety**: Shared types ensure consistency
✅ **Better Testing**: Single test suite for business logic
✅ **Easier Maintenance**: Changes in one place affect both apps
✅ **Consistent Behavior**: Guaranteed identical logic between frontend/backend

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
- **Current Phase**: Phase 3 Complete - Ready for Phase 4 (Frontend Integration)

## Completed Work
✅ **Shared Package Created**: `@gtd/shared` package with proper workspace setup
✅ **Generic Domain Types**: TaskBase, TaskWithSubtasks with generic date handling
✅ **Pure Business Logic**: TaskPriorityService extracted with full sorting algorithm
✅ **Date Utilities**: Unified date handling for both Date objects and strings
✅ **Build System**: TypeScript compilation and workspace integration working
✅ **Backend Integration Complete**: Backend now uses shared domain service, eliminating ~200 lines of duplicated code
✅ **Backend Adapters**: Created TaskAdapter for type conversion between Prisma and shared domain types
✅ **Backend Tests Updated**: All backend tests passing with shared package integration