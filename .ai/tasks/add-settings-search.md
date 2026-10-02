# Task: Add Settings Search

## Goal

Add a search feature to the Settings page.

The user should be able to enter a keyword and filter settings
by name or key.

## Requirements

- Add a search input to the Settings page.
- Search by:
  - setting name
  - setting key
- Search should be case-insensitive.
- Keep the existing Settings functionality unchanged.
- Do not change the database schema.

## Constraints

- Follow the existing project architecture.
- Keep the implementation small and focused.
- Add tests for the new behavior where appropriate.
- Do not modify unrelated files.

## Validation

Run:

```bash
node scripts/check.mjs