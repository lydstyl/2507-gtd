# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level (monorepo)

- `npm run dev` - Start backend (3000) and frontend (5173) concurrently
- `npm run build` - Build shared → backend → frontend
- `npm run build:shared` - Build shared package only
- `npm run test` - Run all tests (shared + backend + frontend)
- `npm run prod:update` - Pull, build, and restart production via PM2

### Backend (`cd backend`)

- `npm run dev` - Start with nodemon
- `npm run test` - Run all Vitest tests (sequential, single fork due to SQLite)
- `npm run test:domain` - Domain layer tests only
- `npm run test:usecases` - Use case tests only
- `npm run test:integration` - Integration/e2e tests only
- `npx vitest run __tests__/task-sorting.test.ts` - Run a single test file
- `npx vitest run -t "test name pattern"` - Run tests matching a pattern
- `npm run db:migrate` / `db:push` / `db:studio` - Prisma database operations

### Frontend (`cd frontend`)

- `npm run dev` - Start Vite dev server
- `npm run test` - Run Vitest tests
- `npm run test:domain` / `test:usecases` / `test:components` - Layer-specific tests
- `npm run lint` - ESLint

### Shared package (`cd shared`)

- `npm run build` - Build both ESM and CommonJS outputs
- `npm test` - Run shared domain tests

## Architecture

This is a GTD task management app: Node.js/Express backend + React/Vite frontend + `@gtd/shared` domain package. All three are npm workspaces in a monorepo.

### The shared package (`@gtd/shared`) is the most important architectural decision

All business logic lives in `shared/src/domain/`: entities, services, validation, constants, errors. Both backend and frontend import from this package. When adding business logic, **always check if it belongs in shared first**.

The shared package uses generic date types to bridge backend (`Date` objects) and frontend (JSON string dates):

```typescript
type BackendTask = TaskBase<Date>   // Prisma → backend
type FrontendTask = TaskBase<string> // JSON API → frontend
```

Each side converts via an adapter: `BackendTaskAdapter` / `FrontendTaskAdapter`.

### Clean Architecture layers (both backend and frontend)

```
Domain (entities, types) → Use Cases (business workflows) → Interfaces (repository contracts)
  → Infrastructure (Prisma/HTTP implementations) → Presentation (controllers/React components)
```

**Backend** (`backend/src/`): `domain/` → `usecases/` → `interfaces/repositories/` → `infrastructure/` (Prisma, AI, logging) → `presentation/` (controllers, routes, middleware, dto)

**Frontend** (`frontend/src/`): `domain/` → `usecases/` → `interfaces/repositories/` → `infrastructure/` (HTTP repos, adapters) → `pages/` + `components/` + `hooks/`

Dependency injection via a `Container` singleton in `infrastructure/container.ts` on both sides.

### AI Chatbot

The chatbot (`/chat` route) uses the **Vercel AI SDK** (`ai` package) with `streamText` and tool-calling. `ChatUseCase` wraps the full CRUD use cases and exposes them as AI tools. LLM provider is configured via env vars:

```bash
LLM_PROVIDER="anthropic"   # anthropic | openai | openrouter
ANTHROPIC_API_KEY="sk-ant-..."
# LLM_MODEL=""             # optional, uses provider defaults
```

`LLMProviderFactory` in `backend/src/infrastructure/ai/` handles provider selection.

## Key Patterns

### Task sorting (non-obvious)

Tasks are sorted server-side into six ordered categories: Collected → Overdue → Today → Tomorrow → No-date → Future. "Collected" tasks are those with `importance=0, complexity=3` and no dates (default new task state awaiting categorization). The frontend mirrors this logic in `TaskCategoryService` for color-coded card display.

### Priority system

`points = importance × complexity`. Importance scale 0–50, complexity 1–9. Sorting within categories uses points descending.

### Task hierarchy

Self-referencing `parentId`. Root tasks have `parentId = null`. Cascade delete removes subtasks. The frontend renders nested structure recursively.

### Authentication

JWT stored in localStorage. All API routes under `/api` (except `/api/auth`) require `Authorization: Bearer <token>`. Backend middleware injects `userId` into request; all repository queries filter by it.

## Environment Setup

Copy `backend/.env.example` to `backend/.env`. Key variables:

- `DATABASE_URL` — SQLite path for dev, PostgreSQL URL for prod
- `JWT_SECRET` — change from default in production
- `CORS_ORIGINS` — comma-separated allowed origins
- `LLM_PROVIDER` / `ANTHROPIC_API_KEY` — for chatbot feature

## Port Configuration

- Development: Backend 3000, Frontend 5173
- Local test build: Backend 3001, Frontend 3002
- Production: Backend 3000 behind Nginx

## Code Style

- Strict TypeScript, no `any`
- `async/await` throughout
- Backend interfaces prefixed with `I` (e.g., `ITaskRepository`)
- Frontend components in PascalCase; hooks/utilities in camelCase
- Tailwind CSS utility-first; no CSS modules
- TanStack Query for server state in the frontend
- Zod for input validation in backend controllers
