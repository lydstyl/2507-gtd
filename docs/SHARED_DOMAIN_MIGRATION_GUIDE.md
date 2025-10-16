# Shared Domain Package Migration Guide

This guide documents the completed migration to a shared domain package and provides guidance for future developers on maintaining and extending the shared architecture.

## Migration Overview

**Completed**: September 28, 2025
**Duration**: 3 days (Phase 1-11)
**Impact**: 770+ lines of duplicated code eliminated
**Test Coverage**: 119 shared domain tests + existing frontend/backend tests

## What Was Migrated

### Phase Summary

| Phase | Component | Lines Eliminated | Status |
|-------|-----------|------------------|---------|
| 1-5 | Package Setup & Task Priority Service | ~200 lines | ✅ Complete |
| 6 | Task Utilities & Business Logic | ~130 lines | ✅ Complete |
| 7 | Business Constants & Rules | ~80 lines | ✅ Complete |
| 8 | CSV Import/Export Logic | ~150 lines | ✅ Complete |
| 9 | Domain Error Classes | ~50 lines | ✅ Complete |
| 10 | Tag Domain Types | ~60 lines | ✅ Complete |
| 11 | Final Cleanup & Documentation | ~100 lines | ✅ Complete |
| **Total** | **All Business Logic** | **~770 lines** | **✅ Complete** |

### Migrated Components

#### 1. Task Priority Service (200 lines eliminated)
- **Before**: Duplicated in `backend/src/domain/services/TaskPriorityService.ts` and `frontend/src/domain/services/TaskPriorityService.ts`
- **After**: Consolidated in `shared/src/domain/services/TaskPriorityService.ts`
- **Generic Type Support**: Works with both Date objects (backend) and string dates (frontend)

#### 2. Task Business Logic & Utilities (130 lines eliminated)
- **TaskCategoryService**: Task categorization logic (collected, overdue, today, etc.)
- **TaskValidationService**: Business rule validation and constraints
- **TaskDisplayUtils**: Date formatting and display utilities

#### 3. Business Constants & Rules (80 lines eliminated)
- **BusinessRules.ts**: Task and tag business constants
- **ValidationRules.ts**: Validation patterns and UI constants
- **Eliminated hardcoded constants** throughout backend services

#### 4. CSV Import/Export Logic (150 lines eliminated)
- **CsvService**: Pure CSV parsing and generation logic
- **CsvFileAdapter**: Backend file I/O adapter
- **CsvBrowserAdapter**: Frontend browser download/upload adapter
- **Fixed CSV import tag association bug**

#### 5. Domain Error Classes (50 lines eliminated)
- **BaseError**: Abstract base error class
- **DomainErrors**: Comprehensive error hierarchy
- **Consistent error handling** across frontend and backend

#### 6. Tag Domain Types (60 lines eliminated)
- **TagTypes.ts**: Complete tag domain type system
- **TagValidationService**: Centralized tag validation logic
- **Consolidated tag interfaces** from frontend and backend

## Architecture Changes

### Before Migration
```
backend/src/domain/           frontend/src/domain/
├── services/                 ├── services/
│   ├── TaskPriorityService   │   ├── TaskPriorityService  (DUPLICATED)
│   └── ...                   │   └── ...
├── utils/                    ├── utils/
│   ├── TaskUtils             │   ├── taskUtils           (DUPLICATED)
│   └── ...                   │   └── ...
├── constants/                ├── types/
│   └── BusinessRules         │   └── BusinessConstants   (DUPLICATED)
└── errors/                   └── ...
    └── DomainErrors          (Error handling inconsistent)
```

### After Migration
```
shared/src/domain/
├── entities/
│   ├── TaskTypes.ts          # Generic interfaces
│   ├── TagTypes.ts           # Tag domain types
│   ├── TaskEntity.ts         # Business logic
│   └── TagEntity.ts          # Business logic
├── services/
│   ├── TaskPriorityService.ts    # SINGLE SOURCE
│   ├── TaskValidationService.ts  # SINGLE SOURCE
│   ├── TagValidationService.ts   # SINGLE SOURCE
│   └── CsvService.ts             # SINGLE SOURCE
├── constants/
│   ├── BusinessRules.ts          # SINGLE SOURCE
│   └── ValidationRules.ts        # SINGLE SOURCE
├── errors/
│   └── DomainErrors.ts           # SINGLE SOURCE
└── utils/
    └── DateUtils.ts              # SINGLE SOURCE

backend/src/domain/           frontend/src/domain/
├── entities/                 ├── entities/
│   └── Tag.ts (re-exports)   │   └── Tag.ts (re-exports)
└── ...                       ├── types/
                              │   └── TagTypes.ts (re-exports + UI types)
                              └── ...
```

## Technical Implementation Details

### Generic Type Strategy

The migration solved the Date vs. string type challenge using generics:

```typescript
// Shared generic interface
interface TaskBase<TDate = Date | string> {
  id: string
  name: string
  plannedDate?: TDate
  createdAt: TDate
  updatedAt: TDate
}

// Backend-specific type (Date objects from Prisma)
type BackendTask = TaskBase<Date>

// Frontend-specific type (string dates from API)
type FrontendTask = TaskBase<string>

// Services work with both
class TaskPriorityService {
  static sortByPriority<TDate>(tasks: TaskBase<TDate>[]): TaskBase<TDate>[] {
    // Business logic works with both Date and string types
  }
}
```

### Adapter Pattern Implementation

Platform-specific concerns are handled through adapters:

```typescript
// Backend adapter for file operations
class CsvFileAdapter implements CsvAdapter {
  async writeFile(filename: string, content: string): Promise<void> {
    await fs.writeFile(filename, content)
  }
}

// Frontend adapter for browser downloads
class CsvBrowserAdapter implements CsvAdapter {
  async writeFile(filename: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/csv' })
    // Trigger browser download
  }
}
```

### Validation Enhancement

Centralized validation with business rule integration:

```typescript
// Before: Scattered validation
if (!data.name || data.name.trim().length === 0) {
  throw new Error('Tag name is required')
}
if (data.name.trim().length > 50) {
  throw new Error('Tag name too long')
}

// After: Centralized validation
const validation = TagValidationService.validateCreateData(data)
if (!validation.success) {
  throw new Error(validation.validationErrors?.join(', '))
}
```

## Migration Process

### Step-by-Step Approach

1. **Phase 1-5: Foundation**
   - Created shared package structure
   - Established generic type system
   - Migrated core TaskPriorityService
   - Built comprehensive test suite

2. **Phase 6-10: Business Logic**
   - Systematically moved each domain area
   - Maintained backward compatibility
   - Updated both frontend and backend
   - Ensured all tests pass

3. **Phase 11: Cleanup**
   - Removed duplicate files
   - Updated documentation
   - Created migration guides

### Testing Strategy

Each phase included rigorous testing:

- **Shared Package**: 119 domain tests
- **Backend**: 250+ tests continue to pass
- **Frontend**: 250 tests continue to pass
- **Integration**: End-to-end functionality verified

### Backward Compatibility

Migration maintained compatibility through:

- **Re-export files**: Local domain files re-export from shared package
- **Adapter pattern**: Platform-specific extensions handled locally
- **Gradual migration**: Each phase was independently deployable

## For Future Developers

### When to Add to Shared Package

✅ **Add to shared package when:**
- Business rules that apply to both frontend and backend
- Validation logic (input validation, business rule checking)
- Domain calculations (priority, points, categorization)
- Data transformations (CSV parsing, date handling)
- Core domain types and interfaces
- Error classes for domain operations

❌ **Keep in local domain when:**
- Platform-specific extensions (UI ordering, display properties)
- UI-specific types (search results, statistics, analytics)
- Infrastructure concerns (database connections, HTTP clients)
- Presentation logic (styling, formatting for display)

### Migration Process for New Features

When you find duplicated logic:

1. **Identify the duplication**
   ```bash
   # Search for similar patterns
   grep -r "calculatePoints" backend/ frontend/
   ```

2. **Create shared version**
   ```typescript
   // shared/src/domain/services/NewService.ts
   export class NewService {
     static sharedMethod<TDate>(data: DataBase<TDate>): ResultBase<TDate> {
       // Business logic that works with both platforms
     }
   }
   ```

3. **Add comprehensive tests**
   ```typescript
   // shared/src/domain/__tests__/services/NewService.test.ts
   describe('NewService', () => {
     it('should work with Date objects', () => {
       const result = NewService.sharedMethod(backendData)
       expect(result).toBeDefined()
     })

     it('should work with string dates', () => {
       const result = NewService.sharedMethod(frontendData)
       expect(result).toBeDefined()
     })
   })
   ```

4. **Update shared package exports**
   ```typescript
   // shared/src/index.ts
   export { NewService } from './domain/services/NewService'
   ```

5. **Build shared package**
   ```bash
   npm run build:shared
   ```

6. **Update backend**
   ```typescript
   // Replace local implementation
   import { NewService } from '@gtd/shared'
   ```

7. **Update frontend**
   ```typescript
   // Replace local implementation
   import { NewService } from '@gtd/shared'
   ```

8. **Run all tests**
   ```bash
   npm run test:all
   ```

9. **Remove duplicated files**
   ```bash
   rm backend/src/domain/services/OldService.ts
   rm frontend/src/domain/services/OldService.ts
   ```

### Common Patterns

#### Generic Service Pattern
```typescript
export class DomainService {
  static process<TDate>(
    item: ItemBase<TDate>,
    context: ContextBase<TDate>
  ): ProcessedItem<TDate> {
    // Business logic that works with both Date and string types
    return processedItem
  }
}
```

#### Validation Service Pattern
```typescript
export class ValidationService {
  static validateData(data: unknown): ValidationResult {
    const errors: string[] = []

    // Validation logic
    if (!isValid(data)) {
      errors.push('Validation error')
    }

    return {
      success: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined
    }
  }
}
```

#### Adapter Interface Pattern
```typescript
// Shared interface
export interface PlatformAdapter {
  platformSpecificMethod(data: unknown): Promise<void>
}

// Backend implementation
class BackendAdapter implements PlatformAdapter {
  async platformSpecificMethod(data: unknown): Promise<void> {
    // Backend-specific implementation
  }
}

// Frontend implementation
class FrontendAdapter implements PlatformAdapter {
  async platformSpecificMethod(data: unknown): Promise<void> {
    // Frontend-specific implementation
  }
}
```

## Troubleshooting Guide

### Build Issues

**Problem**: Shared package won't build
```bash
Error: Cannot find module '@gtd/shared'
```

**Solution**:
1. Ensure workspace is set up correctly in root package.json
2. Build shared package first: `npm run build:shared`
3. Check imports use `@gtd/shared`, not relative paths

### Type Issues

**Problem**: TypeScript can't resolve shared types
```bash
Error: Module '@gtd/shared' has no exported member 'TaskEntity'
```

**Solution**:
1. Check if type is exported in `shared/src/index.ts`
2. Rebuild shared package: `npm run build:shared`
3. Restart TypeScript server in IDE

### Test Issues

**Problem**: Tests fail after migration
```bash
Error: Cannot resolve '@gtd/shared' in test files
```

**Solution**:
1. Update test imports to use `@gtd/shared`
2. Ensure test data matches shared interfaces
3. Run shared tests first: `npm run test:shared`

### Runtime Issues

**Problem**: Business logic behaves differently
```bash
Error: Expected behavior X, got behavior Y
```

**Solution**:
1. Check if adapters are properly converting data types
2. Verify business rules are correctly centralized
3. Compare shared service logic with old implementations

## Maintenance Guidelines

### Regular Tasks

1. **Keep shared package up to date**
   - Run `npm run test:shared` before making changes
   - Ensure all platforms still work after shared changes

2. **Monitor for new duplication**
   - Review PRs for duplicated business logic
   - Move common patterns to shared package

3. **Update documentation**
   - Keep README.md current with new services
   - Update examples when interfaces change

### Code Review Checklist

When reviewing PRs:

- [ ] Is this business logic that should be in shared package?
- [ ] Are there similar patterns in other platform?
- [ ] Do tests cover both Date and string date scenarios?
- [ ] Are adapters properly handling platform differences?
- [ ] Is the shared package exported correctly?

## Success Metrics

The shared domain package migration achieved:

✅ **770+ lines of duplication eliminated**
✅ **100% test coverage maintained** (119 shared + 500+ platform tests)
✅ **Zero breaking changes** during migration
✅ **Improved consistency** between frontend and backend
✅ **Faster development** with centralized business rules
✅ **Better maintainability** with single source of truth
✅ **Type safety** with shared interfaces
✅ **Comprehensive documentation** for future developers

## Future Opportunities

Areas for potential expansion:

1. **User domain logic** - User preferences, settings validation
2. **Notification domain** - Business rules for reminders and alerts
3. **Search domain** - Advanced search and filtering logic
4. **Analytics domain** - Business metrics and reporting calculations
5. **Export domain** - Additional export formats and transformations

---

For technical details, see [shared/README.md](./shared/README.md)
For architecture guidelines, see [CLAUDE.md](./CLAUDE.md)