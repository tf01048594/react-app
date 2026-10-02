# AI Coding Agent

## Goal

Implement user requests while preserving the existing architecture
and ensuring the project passes the validation harness.

## Local agent

The repository includes a local AI coding agent:

```bash
node scripts/agent.mjs .ai/tasks/build-setting-page.md
```

The agent uses a pluggable LLM provider layer. Supported providers are:

- `openai`
- `gemini`

Provider selection and credentials are configured through the root `.env` file.
The agent automatically loads that file when present. Shell environment variables
take precedence over values from `.env`.

Example:

```text
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
AGENT_MAX_ITERATIONS=8
```

For OpenAI:

```text
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

`LLM_MODEL`, when set, overrides the provider-specific model.

The actual `.env` file must never be committed.

The agent is intentionally local-only at this stage:
- It can read and write project files.
- It can run `scripts/check.mjs`.
- It can read `.ai/validation-report.json`.
- It does not commit, push, create branches, or create pull requests.
- Protected files such as `.env`, `.git`, `node_modules`, `dist`, and the validation report cannot be read or written through agent tools.

## LLM provider layer

The provider adapters live under:

```text
scripts/llm/
├── openai.mjs
└── gemini.mjs
```

The agent loop does not depend on provider-specific HTTP APIs.
Both providers expose the same normalized model result to the agent loop.

This keeps the following logic provider-independent:
- task loading
- repository tools
- validation
- self-correction loop
- iteration limits
- changed-file review

## Workflow

1. Read the relevant .ai instructions, architecture, workflow, agent rules, and task file when available.
2. Inspect existing code before changing it.
3. Make the smallest reasonable implementation.
4. Run `node scripts/check.mjs`.
5. Read the machine-readable report at `.ai/validation-report.json`.
6. If validation fails:
   - Read the failure output from the report.
   - Identify the root cause.
   - Fix the code.
   - Run validation again.
7. Do not report completion until validation passes.
8. Review the changed files before finishing.

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
