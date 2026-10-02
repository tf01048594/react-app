# AI Coding Agent

## Goal

Implement user requests while preserving the existing architecture
and ensuring the project passes the validation harness.

## Local agent

The repository includes a local AI coding agent:

```bash
node scripts/agent.mjs .ai/tasks/build-setting-page.md
```

The agent uses the OpenAI Responses API and requires:

```text
OPENAI_API_KEY
OPENAI_MODEL
AGENT_MAX_ITERATIONS
```

Example environment configuration is documented in `.env.example`.

The agent is intentionally local-only at this stage:
- It can read and write project files.
- It can run `scripts/check.mjs`.
- It can read `.ai/validation-report.json`.
- It does not commit, push, create branches, or create pull requests.
- Protected files such as `.env`, `.git`, `node_modules`, `dist`, and the validation report cannot be read or written through agent tools.

## Workflow

1. Read the relevant files before making changes.
2. Read `.ai/instructions.md`.
3. Read `.ai/architecture.md`.
4. Read `.ai/workflow.md`.
5. Understand the requested change.
6. Make the smallest reasonable implementation.
7. Run `node scripts/check.mjs`.
8. Read the machine-readable report at `.ai/validation-report.json`.
9. If validation fails:
   - Read the failure output from the report.
   - Identify the root cause.
   - Fix the code.
   - Run validation again.
10. Do not report completion until validation passes.
11. Review the changed files before finishing.

## Validation

The project validation command is:

```bash
node scripts/check.mjs
```

The command writes a machine-readable report to:

```text
.ai/validation-report.json
```

The report is local runtime output and is ignored by Git.
