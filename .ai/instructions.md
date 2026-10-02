# AI Development Instructions

## 1. General Rules

- Read the existing code before making changes.
- Understand the existing architecture before implementing a feature.
- Prefer small and focused changes.
- Reuse existing code when possible.
- Do not rewrite working code without a clear reason.
- Do not introduce a new dependency unless it is necessary.
- Keep the existing project architecture unless the task requires changing it.

## 2. Frontend

The frontend is located in `/frontend`.

Technology:
- React
- TypeScript
- Vite

Rules:
- Use TypeScript.
- Keep React components focused.
- Avoid putting complex business logic directly inside UI components.
- Reuse existing components and utilities where possible.

## 3. Backend

The backend is located in `/backend`.

Technology:
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

Rules:
- API logic belongs in the backend.
- Validate external input before processing it.
- Use the existing Prisma layer for database access.
- Do not access the database directly from frontend code.

## 4. Database

- Database schema changes must be intentional.
- Explain migration impact before changing the database schema.
- Do not delete existing data or database structures unless explicitly requested.

## 5. Before Completing a Task

The implementation must be validated.

At minimum:

- Frontend lint
- Frontend build
- Backend type checking
- Backend tests

Never claim that a task is complete if validation has not been performed.

## 6. Code Changes

Before modifying code:

1. Identify the relevant files.
2. Understand how the existing implementation works.
3. Explain the planned changes.
4. Make the smallest reasonable change.

After modifying code:

1. Review the changed files.
2. Run validation.
3. Fix validation errors.
4. Summarize the changes.