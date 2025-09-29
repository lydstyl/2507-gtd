# CLAUDE.md - Development Guidelines for GTD Task Management App

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Monorepo Scripts (Root Level)

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only backend (port 3000)
- `npm run dev:frontend` - Start only frontend (port 5173)
- `npm run build` - Build both backend and frontend for production
- `npm run install:all` - Install dependencies for all workspaces

### Backend Commands (cd backend)

- `npm run dev` - Start backend dev server with nodemon
- `npm run build` - Compile TypeScript to JavaScript (outputs to dist/)
- `npm run start` - Run production build
- `npm run test` - Run Vitest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:domain` - Run domain layer tests only
- `npm run test:usecases` - Run use cases tests only
- `npm run test:integration` - Run integration tests only
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Frontend Commands (cd frontend)

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run test` - Run frontend tests
- `npm run test:domain` - Run domain layer tests only
- `npm run test:usecases` - Run use cases tests only
- `npm run test:components` - Run component tests only

### Testing & Deployment

- `./deploy.sh test-local` - Build and test locally (ports 3001/3002)
- `./test-built-app.sh` - Run automated tests on built application

## Architecture Overview

This is a full-stack GTD (Getting Things Done) task management application using **Clean Architecture** principles on both backend and frontend.

## Shared Domain Package (@gtd/shared)

The application uses a **shared domain package** to eliminate code duplication and ensure consistency between frontend and backend. This package contains all business logic, domain types, validation rules, and constants.

### Shared Package Structure

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

### Shared Package Commands

- `cd shared && npm run build` - Build shared package (both ESM and CommonJS)
- `cd shared && npm test` - Run shared domain tests (119 tests)
- `npm run build:shared` - Build shared package from root level

### Key Shared Components

**Domain Services:**
- `TaskPriorityService` - Task sorting and priority calculation
- `TaskCategoryService` - Task categorization (collected, overdue, etc.)
- `TaskValidationService` - Task validation with business rules
- `TagValidationService` - Tag validation with business rules
- `CsvService` - CSV import/export logic

**Domain Types:**
- `TaskBase<TDate>` - Generic task interface (Date or string)
- `TagBase<TDate>` - Generic tag interface (Date or string)
- Backend types: `BackendTask`, `BackendTag` (using Date objects)
- Frontend types: `FrontendTask`, `FrontendTag` (using string dates)

**Business Rules:**
- `TASK_CONSTANTS` - Task validation limits and defaults
- `TAG_CONSTANTS` - Tag validation limits and defaults
- `PRIORITY_LEVELS` - Task priority categorization
- `COMPLEXITY_LEVELS` - Task complexity levels
- `VALIDATION_PATTERNS` - Regex patterns for validation

**Domain Errors:**
- `BaseError` - Abstract base error class
- `ValidationError` - Input validation errors
- `TaskValidationError` - Task-specific validation errors
- `TagValidationError` - Tag-specific validation errors
- `CsvError` - CSV import/export errors

### Generic Type Strategy

The shared package uses generic types to handle the Date/string difference between backend and frontend:

```typescript
// Shared domain with generic date handling
interface TaskBase<TDate = Date | string> {
  id: string
  name: string
  plannedDate?: TDate
  dueDate?: TDate
  createdAt: TDate
  updatedAt: TDate
  // ... other properties
}

// Backend uses Date objects from database
type BackendTask = TaskBase<Date>

// Frontend uses string dates from JSON API
type FrontendTask = TaskBase<string>
```

### Integration Pattern

Both frontend and backend integrate with the shared package through adapters:

```typescript
// Backend adapter (TaskAdapter.ts)
class BackendTaskAdapter {
  static toGeneric(task: PrismaTask): BackendTask {
    // Convert Prisma types to shared domain types
  }
}

// Frontend adapter (TaskAdapter.ts)
class FrontendTaskAdapter {
  static toGeneric(task: ApiTask): FrontendTask {
    // Convert API response to shared domain types
  }
}
```

### Benefits Achieved

✅ **920-970 lines of duplication eliminated** (Phases 1-12 completed)
✅ **Single source of truth** for all business logic
✅ **Type safety** with shared interfaces
✅ **Consistent validation** between frontend and backend
✅ **Unified business rules** and constants
✅ **Comprehensive test coverage** (119 shared domain tests)
✅ **Clean separation** of domain vs. infrastructure concerns
✅ **Shared use case architecture** with OperationResult pattern (99.5% test pass rate)

## Clean Architecture Implementation

Both backend and frontend follow Uncle Bob's Clean Architecture with clear layer separation:

### Backend Clean Architecture (Node.js + Express + Prisma)

```
backend/src/
├── domain/
│   └── entities/         # Re-exports from @gtd/shared (Task, Tag, User)
├── usecases/            # Business logic using shared domain services
├── interfaces/
│   └── repositories/    # Repository contracts
├── infrastructure/
│   ├── repositories/    # Prisma implementations with shared domain integration
│   ├── adapters/        # Platform-specific adapters (e.g., CsvFileAdapter)
│   └── container.ts     # Dependency injection
├── presentation/
│   ├── controllers/     # HTTP controllers using shared validation
│   ├── routes/         # Express routes
│   ├── middleware/     # Authentication, validation
│   └── dto/           # Data transfer objects
└── config/             # Configuration
```

### Frontend Clean Architecture (React + TypeScript + Tailwind)

```
frontend/src/
├── domain/
│   ├── entities/        # Re-exports from @gtd/shared (TaskEntity, TagEntity)
│   ├── services/        # Re-exports from @gtd/shared + UI-specific services
│   └── types/          # Re-exports from @gtd/shared + UI-specific types
├── usecases/
│   ├── tasks/          # Task business operations using shared domain services
│   ├── tags/           # Tag business operations using shared domain services
│   └── base/           # Base use case classes
├── interfaces/
│   └── repositories/   # Repository contracts
├── infrastructure/
│   ├── repositories/   # HTTP implementations with shared domain integration
│   ├── adapters/       # Platform-specific adapters (e.g., CsvBrowserAdapter)
│   └── container.ts    # Dependency injection
├── presentation/
│   ├── components/     # React components (UI only)
│   ├── hooks/         # Custom React hooks
│   └── adapters/      # Presentation layer adapters
└── services/          # Legacy API services (being phased out)
```

## Clean Architecture Decision Flow

When adding a new feature, follow this decision tree:

### 1. **Shared Domain Package First** - "Is this business logic?"

**🎯 IMPORTANT: Always check if the logic should go in the shared package (@gtd/shared) first!**

**Add to shared package when:**
- Business rules that apply to both frontend and backend
- Validation logic (task validation, tag validation)
- Domain calculations (priority, points, categorization)
- Data transformations (CSV parsing, date handling)
- Core domain types and interfaces

**Create in local `domain/` when:**
- Platform-specific extensions (e.g., position field for frontend tags)
- UI-specific types (search results, statistics, performance metrics)
- Re-exports from shared package for backward compatibility

**Example: Adding validation should go in shared package first**
```typescript
// shared/src/domain/services/TaskValidationService.ts
export class TaskValidationService {
  static validateDueDate(dueDate: Date): ValidationResult {
    // Business rule: due date cannot be in the past
  }
}
```

**Example: Adding Due Date Reminders**
```typescript
// domain/entities/Task.ts
export class TaskEntity {
  isUrgent(): boolean {
    return this.isDueToday() || this.isOverdue()
  }

  getDaysUntilDue(): number {
    // Business logic for calculating days
  }
}

// domain/services/TaskReminderService.ts
export class TaskReminderService {
  static getTasksNeedingReminders(tasks: TaskEntity[]): TaskEntity[] {
    return tasks.filter(task => task.isUrgent() && !task.isCompleted)
  }
}
```

### 2. **Use Cases Layer** - "What does the application do?"

**Create in `usecases/` when:**
- Adding new user workflow (CreateTask, UpdateTask, etc.)
- Orchestrating multiple domain operations
- Adding business validation rules

**Example: Adding Task Snoozing**
```typescript
// usecases/tasks/SnoozeTaskUseCase.ts
export class SnoozeTaskUseCase extends BaseUseCase<SnoozeTaskRequest, SnoozeTaskResponse> {
  async execute(request: SnoozeTaskRequest): Promise<OperationResult<SnoozeTaskResponse>> {
    // 1. Validate input
    // 2. Get current task
    // 3. Apply business rules for snoozing
    // 4. Update task via repository
    // 5. Return result
  }
}
```

### 3. **Interface Layer** - "What external dependencies do we need?"

**Create in `interfaces/repositories/` when:**
- Defining contracts for data access
- Adding new repository methods for use cases

**Example: Adding Search Capability**
```typescript
// interfaces/repositories/TaskRepository.ts
export interface TaskRepository {
  searchTasks(query: string, filters: SearchFilters): Promise<Task[]>
}
```

### 4. **Infrastructure Layer** - "How do we implement external dependencies?"

**Create in `infrastructure/repositories/` when:**
- Implementing repository interfaces
- Adapting external APIs or databases

**Example: Implementing Search**
```typescript
// infrastructure/repositories/HttpTaskRepository.ts
export class HttpTaskRepository implements TaskRepository {
  async searchTasks(query: string, filters: SearchFilters): Promise<Task[]> {
    return await tasksApi.searchTasks({ query, ...filters })
  }
}
```

### 5. **Presentation Layer** - "How do users interact with this?"

**Create in `presentation/components/` when:**
- Adding new UI components
- Creating user interaction handlers

**Example: Search Component**
```typescript
// presentation/components/TaskSearch.tsx
export function TaskSearch() {
  const { searchTasks } = useTaskUseCases()

  const handleSearch = async (query: string) => {
    const result = await searchTasks.execute({ query })
    // Handle UI state update
  }
}
```

## Testing Strategy

### Backend Testing

**Domain Layer Tests** - `backend/__tests__/domain/`
```bash
npm run test:domain  # Test business logic
```

**Use Cases Tests** - `backend/__tests__/usecases/`
```bash
npm run test:usecases  # Test application logic
```

**Integration Tests** - `backend/__tests__/integration/`
```bash
npm run test:integration  # Test full workflows
```

### Frontend Testing

**Domain Tests** - `frontend/src/domain/__tests__/`
```typescript
// domain/__tests__/TaskEntity.test.ts
describe('TaskEntity', () => {
  it('should calculate priority correctly', () => {
    const task = new TaskEntity(mockTask)
    expect(task.calculatePoints()).toBe(250)
  })
})
```

**Use Cases Tests** - `frontend/src/usecases/__tests__/`
```typescript
// usecases/__tests__/CreateTaskUseCase.test.ts
describe('CreateTaskUseCase', () => {
  it('should validate task data before creation', async () => {
    const useCase = new CreateTaskUseCase(mockRepository)
    const result = await useCase.execute({ name: '' })
    expect(result.success).toBe(false)
  })
})
```

**Component Tests** - `frontend/src/components/__tests__/`
```typescript
// Test UI behavior, not business logic
```

## Clean Architecture Benefits in Practice

### 1. **Testability**
- Domain logic tests don't need React or HTTP mocking
- Use cases can be tested with mock repositories
- Business rules are isolated and fast to test

### 2. **Maintainability**
- Changes to UI don't affect business logic
- Changes to API don't affect domain rules
- Clear boundaries make debugging easier

### 3. **Reusability**
- Domain entities work in any context (web, mobile, CLI)
- Use cases can be shared between different UI frameworks
- Business logic is framework-agnostic

### 4. **Team Collaboration**
- Frontend and backend teams can work on domain logic together
- Clear interfaces make parallel development possible
- Business rules are documented in code

## Code Style Guidelines

### TypeScript & Architecture
- **Clean Architecture**: Domain entities → Use cases → Infrastructure → Presentation
- **Strict typing**: Use explicit types, avoid `any`, prefer interfaces over types
- **Async/await**: Always use async/await, never Promises directly
- **Error handling**: Use try/catch with instanceof checks, return structured error responses

### Backend Patterns
- **Controllers**: RESTful endpoints with consistent error handling (400/404/500)
- **Use cases**: Business logic separated from HTTP concerns
- **Repositories**: Interface-based with Prisma implementations
- **Dependency injection**: Constructor injection pattern
- **Authentication**: JWT tokens, user isolation enforced at repository level

### Frontend Patterns
- **React**: Functional components with hooks, no class components
- **Styling**: Tailwind CSS with utility-first approach
- **State management**: React hooks and context, TanStack Query for server state
- **Components**: PascalCase naming, prop interfaces defined above component
- **Imports**: Type imports first, then components, then utilities

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities/hooks
- **Variables**: camelCase, descriptive names (no abbreviations)
- **Functions**: camelCase, verb-noun pattern (getUser, createTask)
- **Interfaces**: PascalCase with 'I' prefix (ITaskRepository)
- **Types**: PascalCase, descriptive names (CreateTaskData)

### Code Organization
- **Imports**: Group by type (React, external libs, internal modules)
- **Error handling**: Centralized in controllers, specific error messages
- **Validation**: Use Zod schemas for input validation
- **Comments**: No comments unless complex business logic requires explanation
- **File structure**: Feature-based organization within clean architecture layers

### Testing
- **Framework**: Vitest for backend, Jest for frontend
- **Structure**: `__tests__/` directories with `.test.ts` files
- **Patterns**: Arrange-Act-Assert, descriptive test names
- **Coverage**: Focus on business logic and edge cases

### Database & Security
- **ORM**: Prisma with SQLite (dev) / PostgreSQL (prod)
- **Migrations**: Version-controlled schema changes
- **Security**: User data isolation, input sanitization, JWT authentication
- **Validation**: Server-side validation with detailed error messages

## Development Best Practices

### When Adding Features:

1. **Start with the Domain**: What business rules apply?
2. **Define the Use Case**: What workflow does the user need?
3. **Create Interfaces**: What external dependencies are needed?
4. **Implement Infrastructure**: How do we fulfill those dependencies?
5. **Build Presentation**: How does the user interact with it?
6. **Write Tests**: Test each layer independently

### File Naming Conventions:

- **Entities**: `TaskEntity.ts`, `TagEntity.ts`
- **Services**: `TaskSortingService.ts`, `TaskCategoryService.ts`
- **Use Cases**: `CreateTaskUseCase.ts`, `UpdateTaskUseCase.ts`
- **Repositories**: `TaskRepository.ts` (interface), `HttpTaskRepository.ts` (implementation)
- **Tests**: `*.test.ts` in corresponding `__tests__` folders

### Data Model

- **Users**: Email/password authentication
- **Tasks**: Hierarchical (unlimited subtasks), priority system (importance/urgency 1-9), optional due dates, rich text notes
- **Tags**: User-scoped, many-to-many with tasks
- **Security**: All data isolated per user

### Key Features

- Unlimited nested subtasks
- Priority matrix (importance, urgency, calculated priority)
- Tag-based organization
- CSV import/export functionality
- Real-time keyboard shortcuts
- Search and filtering
- Rich text notes with TipTap editor
- **Progressive Web App (PWA)**: Offline support, installable, mobile-optimized

## Important Patterns

### Authentication Flow

- JWT tokens stored in localStorage
- All API routes except auth require Authorization header
- Middleware validates tokens and injects user context

### Task Hierarchy

- Self-referencing parentId relationship
- Cascade deletion of subtasks
- Root tasks have parentId = null
- Frontend displays nested structure with action buttons

### Repository Pattern

- Interface definitions in `src/interfaces/repositories/`
- Prisma implementations in `src/infrastructure/repositories/`
- Dependency injection via Container singleton

### API Structure

- RESTful endpoints under `/api`
- Consistent error handling and validation
- User isolation enforced at repository level

## Database Schema Notes

- Uses Prisma with SQLite for development
- Production supports PostgreSQL
- Migrations in `backend/prisma/migrations/`
- Cascade deletes ensure data integrity

## Development Workflow

### Daily Development

1. **Start development**: `npm run dev` (from root)
2. **Test changes continuously**:
   - Backend: `cd backend && npm run test:watch`
   - Frontend: `cd frontend && npm run test:watch`
3. **Layer-specific testing**:
   - Domain logic: `npm run test:domain`
   - Use cases: `npm run test:usecases`
   - Integration: `npm run test:integration`
4. **Before committing**:
   - Run all tests: `npm run test`
   - Build and test locally: `./deploy.sh test-local`
   - Lint frontend: `cd frontend && npm run lint`

### Adding New Features (Clean Architecture Flow)

1. **Domain First**: Define business entities and rules
2. **Use Cases**: Create application workflows
3. **Interfaces**: Define external contracts
4. **Infrastructure**: Implement external dependencies
5. **Presentation**: Build user interface
6. **Tests**: Write tests for each layer

## Task Sorting System

The application implements a sophisticated task sorting algorithm that prioritizes tasks in a deterministic order. This system is implemented in `backend/src/infrastructure/repositories/TaskSorting.ts` and mirrored in the frontend for visual categorization.

### Sorting Order (Priority Descending)

1. **Collected Tasks** - Only new default tasks (importance=0, complexity=3, no dates) that need user categorization
2. **Overdue Tasks** - Tasks past their planned date (sorted by date ascending, then points descending)
3. **Today Tasks** - Tasks planned for today (sorted by points descending)
4. **Tomorrow Tasks** - Tasks planned for tomorrow (sorted by points descending)
5. **No-Date Tasks** - Tasks without planned dates (including high-priority tasks, sorted by points descending)
6. **Future Tasks** - Tasks planned for day+2 or later (sorted by date ascending)

### Visual Category Indicators

The frontend displays color-coded task cards to help users quickly identify task categories.

### Implementation Notes

- Date normalization prevents timezone issues between development/production
- Points system combines importance and complexity for task prioritization
- Subtasks are sorted by points within each parent task
- Sorting is handled server-side to ensure consistency across clients
- Frontend category detection mirrors backend logic exactly

### Key Files

- `backend/src/infrastructure/repositories/TaskSorting.ts` - Core sorting logic
- `frontend/src/domain/services/TaskSortingService.ts` - Frontend sorting logic (mirrors backend)
- `frontend/src/domain/services/TaskCategoryService.ts` - Category detection and styling
- `frontend/src/components/TaskCard.tsx` - Visual task representation
- Tests in `backend/__tests__/task-sorting-*.test.ts` verify sorting behavior

## Progressive Web App (PWA) Implementation

The GTD app is implemented as a Progressive Web App, providing native-like functionality with offline support, installable interface, and enhanced mobile experience.

### PWA Features

- **Offline Access**: Service worker caches static assets and API responses
- **Installable**: Can be installed on home screen like a native app
- **Mobile Optimized**: Responsive design with touch-friendly interface
- **Push Notifications**: Ready for future reminder/notification features
- **Fast Loading**: Service worker provides instant startup from cache

### PWA Configuration Files

- `frontend/vite.config.ts` - VitePWA plugin configuration with manifest and workbox settings
- `frontend/public/manifest.webmanifest` - Auto-generated web app manifest
- `frontend/public/sw.js` - Auto-generated service worker file
- `frontend/src/utils/pwa.ts` - PWA utility functions for registration and install prompts

### PWA Components

- `OfflineIndicator` - Shows offline status to users
- `PWAInstallPrompt` - Prompts users to install the app
- `useOnlineStatus` - Hook for detecting network connectivity

### PWA Testing

```bash
# Build for production (PWA features only work in production)
npm run build

# Test production build with PWA features
cd frontend && npm run serve

# Access at http://localhost:3002 to test PWA functionality
```

### PWA Assets

- Icons: `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `favicon.ico`
- Manifest: Auto-generated with GTD branding and theme colors
- Service Worker: Auto-generated with caching strategies for static assets and API calls

## Port Configuration

- **Development**: Backend 3000, Frontend 5173
- **Local Testing**: Backend 3001, Frontend 3002
- **Production**: Backend 3000 (proxied via Nginx)

## Key Project Patterns
- **Task hierarchy**: Self-referencing parentId relationships
- **Priority system**: Importance (1-5) × Complexity (1-9) = Points
- **Tag system**: Many-to-many with user isolation
- **Rich text**: TipTap editor for task notes
- **CSV import/export**: Full data portability

## Final Notes
- Lint files you create.
- Run tests and build after adding a new feature.
- Follow clean architecture principles: Domain → Use Cases → Infrastructure → Presentation.
- Write tests for domain logic and use cases before implementing UI.
- Use the dependency injection container to access use cases in React components.
- When adding or updating something in the domain (frontend or backend), always try to put it in the shared/src/domain to avoid code repetition.