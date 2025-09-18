# CLAUDE.md

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
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Frontend Commands (cd frontend)

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing & Deployment

- `./deploy.sh test-local` - Build and test locally (ports 3001/3002)
- `./test-built-app.sh` - Run automated tests on built application

## Architecture Overview

This is a full-stack GTD (Getting Things Done) task management application using clean architecture principles.

### Backend (Node.js + Express + Prisma)

- **Clean Architecture**: Domain entities, use cases, repositories, and controllers
- **Domain Layer**: `src/domain/entities/` - Core business entities (Task, Tag, User)
- **Use Cases**: `src/usecases/` - Business logic for tasks and tags
- **Infrastructure**: `src/infrastructure/` - Prisma repositories and DI container
- **Presentation**: `src/presentation/` - Express controllers and routes
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: SQLite with Prisma ORM (PostgreSQL for production)

### Frontend (React + TypeScript + Tailwind)

- **Component-based**: Modular React components in `src/components/`
- **State Management**: React hooks and context
- **UI Framework**: Tailwind CSS for styling
- **Rich Text**: TipTap editor for task notes
- **Build Tool**: Vite for fast development and builds

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

1. Start development: `npm run dev` (from root)
2. Test changes: Run Jest tests in backend
3. Before committing: Build and test locally with `./deploy.sh test-local`
4. Lint frontend: `cd frontend && npm run lint`

## Task Sorting System

The application implements a sophisticated task sorting algorithm that prioritizes tasks in a deterministic order. This system is implemented in `backend/src/infrastructure/repositories/TaskSorting.ts` and mirrored in the frontend for visual categorization.

### Sorting Order (Priority Descending)

1. **Collected Tasks** - New created tasks without due dates that has to be changed (importance, complexity, tag, etc.)
2. **Overdue Tasks** - Tasks past their due date (sorted by date ascending, then points descending)
3. **Today Tasks** - Tasks due today (sorted by points descending)
4. **Tomorrow Tasks** - Tasks due tomorrow (sorted by points descending)
5. **No-Date Tasks** - Tasks without due dates (excluding collected tasks, sorted by points descending)
6. **Future Tasks** - Tasks due day+2 or later (sorted by date ascending)

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
- `frontend/src/utils/taskUtils.ts` - Category detection and styling
- `frontend/src/components/TaskCard.tsx` - Visual task representation
- Tests in `backend/__tests__/task-sorting-*.test.ts` verify sorting behavior

## Port Configuration

- **Development**: Backend 3000, Frontend 5173
- **Local Testing**: Backend 3001, Frontend 3002
- **Production**: Backend 3000 (proxied via Nginx)
- Lint files you create.
- Run tests and build after adding a new feature.
