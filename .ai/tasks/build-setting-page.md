# Task: Build Settings Page

## Goal

Build a Settings page for managing application settings.

## Requirements

- Create a Settings page at `/settings`.
- Load settings from the existing `GET /api/settings` API.
- Display settings using the existing `SettingList` component.
- Display the existing `SettingForm` for creating a new setting.
- After creating a setting, refresh the settings list.
- Allow existing settings to be edited using the existing `SettingItem` functionality.
- Allow existing settings to be deleted.
- Show a loading state while settings are being loaded.
- Show an error message if loading settings fails.
- Keep the existing Home page unchanged.
- Do not change the database schema.

## Architecture

Use the existing frontend structure:

- `pages/` for pages
- `components/` for reusable UI components
- `api/settingApi.ts` for API communication

Prefer reusing the existing:

- `SettingForm`
- `SettingList`
- `SettingItem`
- `settingApi.ts`

## Routing

The existing Sidebar contains a `/settings` link.

Connect `/settings` to the new Settings page using the existing application architecture.

Do not introduce a new routing library unless the current project requires it.

## Constraints

- Follow `.ai/instructions.md`.
- Follow `.ai/architecture.md`.
- Follow `.ai/workflow.md`.
- Follow `.ai/agent.md`.
- Read the existing implementation before making changes.
- Keep the implementation small and focused.
- Do not modify unrelated files.
- Do not change the backend unless required by the existing API behavior.

## Testing

Add appropriate tests for the new behavior where practical.

At minimum, verify that:

- The Settings page loads settings.
- Creating a setting refreshes the list.
- The existing edit and delete functionality continues to work.

## Validation

Run:

```bash
node scripts/check.mjs