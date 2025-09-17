# AGENTS.md - Development Guidelines for GTD Task Management App

## Build/Lint/Test Commands

### Backend Commands (cd backend)
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production build
- `npm run test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test -- --testNamePattern="test name"` - Run single test by name
- `npm run test -- path/to/specific.test.ts` - Run specific test file
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

### Frontend Commands (cd frontend)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Root Commands
- `npm run dev` - Start both backend and frontend concurrently
- `npm run build` - Build both backend and frontend
- `npm run install:all` - Install dependencies for all workspaces

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
- **Framework**: Jest with ts-jest for TypeScript
- **Structure**: `__tests__/` directories with `.test.ts` files
- **Patterns**: Arrange-Act-Assert, descriptive test names
- **Coverage**: Focus on business logic and edge cases

### Database & Security
- **ORM**: Prisma with SQLite (dev) / PostgreSQL (prod)
- **Migrations**: Version-controlled schema changes
- **Security**: User data isolation, input sanitization, JWT authentication
- **Validation**: Server-side validation with detailed error messages

## Development Workflow
1. Run tests before committing: `npm run test`
2. Lint code: `cd frontend && npm run lint`
3. Build locally: `npm run build`
4. Test built app: `./test-built-app.sh`

## Key Project Patterns
- **Task hierarchy**: Self-referencing parentId relationships
- **Priority system**: Importance (1-5) × Complexity (1-9) = Points
- **Tag system**: Many-to-many with user isolation
- **Rich text**: TipTap editor for task notes
- **CSV import/export**: Full data portability