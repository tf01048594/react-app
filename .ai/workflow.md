# AI Development Workflow

## Step 1 — Understand

Before changing code:

- Read the task carefully.
- Inspect the relevant source files.
- Identify existing patterns.
- Identify dependencies between frontend, backend and database.

## Step 2 — Plan

Create a short implementation plan.

The plan should contain:

1. Files that need to change.
2. What will change in each file.
3. Any API changes.
4. Any database changes.
5. Validation that will be performed.

## Step 3 — Implement

Implement the smallest reasonable change.

Do not modify unrelated files.

## Step 4 — Validate

Run the project's validation commands.

Check:

- TypeScript
- ESLint
- Build
- Tests

## Step 5 — Review

Review the changes for:

- Bugs
- Unnecessary changes
- Breaking changes
- Security issues
- Incorrect API behavior
- Database issues

## Step 6 — Report

Provide:

- What changed
- Files changed
- Validation performed
- Remaining issues