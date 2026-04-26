# AGENTS.md

Compact instruction file for OpenCode sessions working in this repository.

## Monorepo Structure

npm workspaces: `backend`, `frontend`, `shared`. A fourth directory `mcp-server/` exists but is **not** in the workspace list and must be installed/built separately.

## Critical Build Order

`shared` must be built before `backend` and `frontend` can use it. Root `npm run build` does this automatically:
```
npm run build:shared && npm run build:backend && npm run build:frontend
```

## Developer Commands

### Root
- `npm run dev` — Backend (3000) + Frontend (5173) concurrently
- `npm run build` — Build shared → backend → frontend
- `npm run test` — Run shared tests, then backend tests, then frontend tests
- `npm run prod:update` — Pull, build, restart production via PM2

### Backend (`cd backend`)
- `npm run dev` — Nodemon with ts-node
- `npm run test` — All Vitest tests. **Runs sequentially in a single fork** because of SQLite. `SKIP_LLM_TESTS=true` is set by default.
- `npm run test:llm` — Run LLM chat tests only (requires API key)
- `npx vitest run __tests__/task-sorting.test.ts` — Single test file
- `npx vitest run -t "pattern"` — Run tests by name pattern
- `npm run db:migrate` / `db:push` / `db:studio` — Prisma operations (load `.env` from repo root via `dotenv -e ../.env`)

### Frontend (`cd frontend`)
- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — Production build
- `npm run test` — Vitest (uses `vite.config.test.ts`)
- `npm run test:domain` / `test:usecases` / `test:components` — Layer-specific test runs
- `npm run lint` — ESLint

### Shared (`cd shared`)
- `npm run build` — Builds both ESM (`dist/esm`) and CJS (`dist/cjs`) outputs
- `npm test` — Vitest

## Architecture: Where Code Belongs

**Business logic lives in `shared/src/domain/` first.** Both backend and frontend import `@gtd/shared`. When adding new logic, ask if it belongs in shared before placing it elsewhere.

Date bridging: `TaskBase<Date>` (backend / Prisma) ↔ `TaskBase<string>` (frontend / JSON). Convert via `BackendTaskAdapter` / `FrontendTaskAdapter`.

Clean Architecture layers on both sides:
```
domain/ → usecases/ → interfaces/repositories/ → infrastructure/ → presentation/
```

DI via `Container` singleton in `infrastructure/container.ts` on both backend and frontend.

## Environment Setup

Single `.env` file at repo root serves both local dev and Docker:
1. Copy `.env.example` to `.env`
2. `DB_PASSWORD` is used directly by Docker compose and referenced in `DATABASE_URL`
3. Backend loads it via `config({ path: '../.env' })` because its CWD is `backend/`

Key env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `LLM_PROVIDER`, `ANTHROPIC_API_KEY` (or `OPENROUTER_API_KEY` / `OPENAI_API_KEY`).

## Ports

- Dev: Backend **3000**, Frontend **5173**
- Local test build: Backend **3001**, Frontend **3002**
- Docker: Exposes backend on host **3001** and frontend on **3080**

## Testing Quirks

- **Backend tests must run sequentially** (`singleFork: true` in `vitest.config.js`) to avoid SQLite contention.
- Backend test timeout is **30s** for DB operations.
- LLM tests are skipped by default (`SKIP_LLM_TESTS=true`). Run `npm run test:llm` explicitly when needed.
- Coverage thresholds: 80% branches, functions, lines, statements.

## Prisma / Database

- Schema at `backend/prisma/schema.prisma`
- SQLite (`dev.db`) is used for development and tests inside `backend/`
- PostgreSQL is used for the Docker production setup
- Migrations live in `backend/prisma/migrations/`

## MCP Server (Optional, standalone)

The `mcp-server/` directory is **not** part of the npm workspaces. Install and build it independently:
```bash
cd mcp-server && npm install && npm run build
```

## Chatbot / LLM

Backend chat uses Vercel AI SDK (`streamText` + tool-calling). Provider selection via `LLMProviderFactory` in `backend/src/infrastructure/ai/`. Valid `LLM_PROVIDER` values: `anthropic`, `openai`, `openrouter`.

## Non-obvious Business Rules

- **Task sorting**: Six ordered categories — Collected → Overdue → Today → Tomorrow → No-date → Future.
- **Collected tasks**: `importance=0, complexity=3` with no dates (default state for new tasks).
- **Priority**: `points = importance × complexity`. Importance 0–50, complexity 1–9. Within categories sort by points descending.
- **Hierarchy**: Self-referencing `parentId`. Cascade delete removes subtasks.

## Code Conventions

- Strict TypeScript, no `any`
- Backend interfaces prefixed with `I` (e.g., `ITaskRepository`)
- Frontend components PascalCase; hooks/utilities camelCase
- Tailwind CSS utility-first; no CSS modules
- TanStack Query for server state (frontend)
- Zod for input validation (backend controllers)
