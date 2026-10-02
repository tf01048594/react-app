import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { callOpenAI } from "./llm/openai.mjs";
import { callGemini } from "./llm/gemini.mjs";

const root = process.cwd();

function loadEnvFile() {
    const envPath = path.join(root, ".env");

    if (!fs.existsSync(envPath)) {
        return;
    }

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

        if (!match) {
            continue;
        }

        const [, key, rawValue] = match;
        let value = rawValue.trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        // Explicit shell environment variables take precedence over .env.
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile();

const maxIterations = Number(process.env.AGENT_MAX_ITERATIONS ?? 8);
const provider = process.env.LLM_PROVIDER ?? "openai";
const model = process.env.LLM_MODEL ??
    (provider === "gemini" ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL);

const apiKey = provider === "gemini"
    ? process.env.GEMINI_API_KEY
    : process.env.OPENAI_API_KEY;

if (!apiKey) {
    const keyName = provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
    console.error(`Missing ${keyName}. Configure it in .env or the shell environment.`);
    process.exit(1);
}

if (!model) {
    console.error("Missing LLM_MODEL. Configure it in .env or the shell environment.");
    process.exit(1);
}

if (provider !== "openai" && provider !== "gemini") {
    console.error(`Unsupported LLM_PROVIDER: ${provider}. Use openai or gemini.`);
    process.exit(1);
}

const taskArg = process.argv.slice(2).join(" ").trim();

if (!taskArg) {
    console.error("Usage: node scripts/agent.mjs <task-file-or-task>");
    process.exit(1);
}

function resolveInsideRoot(relativePath) {
    if (typeof relativePath !== "string" || !relativePath.trim()) {
        throw new Error("Path must be a non-empty string.");
    }

    const resolved = path.resolve(root, relativePath);
    const relative = path.relative(root, resolved);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error("Path must stay inside the repository.");
    }

    return resolved;
}

function isProtectedPath(relativePath) {
    const normalized = relativePath.replaceAll("\\", "/");

    return normalized === ".env" ||
        normalized.startsWith(".env.") ||
        normalized.startsWith(".git/") ||
        normalized === ".git" ||
        normalized.includes("/node_modules/") ||
        normalized.startsWith("node_modules/") ||
        normalized.includes("/dist/") ||
        normalized.startsWith("dist/") ||
        normalized === ".ai/validation-report.json";
}

function readTextFile(relativePath) {
    const filePath = resolveInsideRoot(relativePath);

    if (isProtectedPath(relativePath)) {
        throw new Error(`Reading this path is not allowed: ${relativePath}`);
    }

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${relativePath}`);
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
        throw new Error(`Not a file: ${relativePath}`);
    }

    if (stat.size > 200_000) {
        throw new Error("File is too large. Read a smaller relevant file instead.");
    }

    return fs.readFileSync(filePath, "utf8");
}

function listFiles(relativePath = ".") {
    const directory = resolveInsideRoot(relativePath);

    if (!fs.existsSync(directory)) {
        throw new Error(`Directory not found: ${relativePath}`);
    }

    return fs.readdirSync(directory, { withFileTypes: true })
        .filter(entry => {
            const child = path.posix.join(relativePath.replaceAll("\\", "/"), entry.name);
            return !isProtectedPath(child);
        })
        .map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file"
        }));
}

function writeTextFile(relativePath, content) {
    const filePath = resolveInsideRoot(relativePath);

    if (isProtectedPath(relativePath)) {
        throw new Error(`Writing this path is not allowed: ${relativePath}`);
    }

    if (typeof content !== "string") {
        throw new Error("File content must be a string.");
    }

    if (content.length > 500_000) {
        throw new Error("Refusing to write a file larger than 500 KB.");
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");

    return `Wrote ${relativePath}`;
}

function runValidation() {
    try {
        execFileSync(
            process.execPath,
            ["scripts/check.mjs"],
            {
                cwd: root,
                encoding: "utf8",
                stdio: "pipe"
            }
        );
    } catch (error) {
        // check.mjs intentionally exits with 1 when validation fails.
    }

    const reportPath = path.join(root, ".ai", "validation-report.json");

    if (!fs.existsSync(reportPath)) {
        throw new Error("Validation report was not generated.");
    }

    return JSON.parse(fs.readFileSync(reportPath, "utf8"));
}

function getChangedFiles() {
    try {
        const output = execFileSync(
            "git",
            ["status", "--short"],
            {
                cwd: root,
                encoding: "utf8"
            }
        );

        return output.trim();
    } catch {
        return "";
    }
}

const tools = [
    {
        type: "function",
        name: "list_files",
        description: "List files and directories at a repository path. Use this to discover relevant project structure before reading files.",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Repository-relative directory path. Use '.' for the repository root."
                }
            },
            required: ["path"],
            additionalProperties: false
        },
        strict: true
    },
    {
        type: "function",
        name: "read_file",
        description: "Read a UTF-8 text file inside the repository. Use this before modifying existing code.",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Repository-relative file path."
                }
            },
            required: ["path"],
            additionalProperties: false
        },
        strict: true
    },
    {
        type: "function",
        name: "write_file",
        description: "Create or replace a UTF-8 text file inside the repository. Keep changes small and focused.",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Repository-relative file path."
                },
                content: {
                    type: "string",
                    description: "Complete UTF-8 file content."
                }
            },
            required: ["path", "content"],
            additionalProperties: false
        },
        strict: true
    },
    {
        type: "function",
        name: "run_validation",
        description: "Run the project's deterministic validation harness. Returns the machine-readable validation report. Use after implementation and after fixes.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
        },
        strict: true
    },
    {
        type: "function",
        name: "get_changed_files",
        description: "Show the current Git working tree status. Use this before finishing to review what the agent changed.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
        },
        strict: true
    }
];

async function callModel(input) {
    if (provider === "gemini") {
        return callGemini({
            apiKey,
            model,
            input,
            tools
        });
    }

    return callOpenAI({
        apiKey,
        model,
        input,
        tools
    });
}

async function executeTool(name, args) {
    try {
        switch (name) {
            case "list_files":
                return listFiles(args.path);
            case "read_file":
                return readTextFile(args.path);
            case "write_file":
                return writeTextFile(args.path, args.content);
            case "run_validation":
                return runValidation();
            case "get_changed_files":
                return getChangedFiles();
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

const task = fs.existsSync(resolveInsideRoot(taskArg))
    ? readTextFile(taskArg)
    : taskArg;

const instructions = `You are a local coding agent working inside an existing repository.

Your job is to implement the user's task, not merely explain it.

Rules:
- Read the relevant .ai instructions, architecture, workflow, agent rules, and task file when available.
- Inspect existing code before changing it.
- Prefer the smallest focused implementation.
- Reuse existing code and dependencies.
- Do not change the database schema unless the task explicitly requires it.
- Do not modify unrelated files.
- You can only interact with the repository through the provided tools.
- Never write .env, .git, node_modules, dist, or the validation report.
- After implementation, run run_validation.
- If validation fails, read the report output, diagnose the root cause, make a focused fix, and run validation again.
- Continue until validation passes or you have reached a genuine blocker.
- Before finishing, call get_changed_files and review the changes.
- Do not claim success unless the latest validation report has success=true.

The user task is:

${task}
`;

let input = [
    {
        role: "user",
        content: instructions
    }
];

for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    console.log(`\n=== Agent iteration ${iteration}/${maxIterations} ===`);

    const response = await callModel(input);
    input.push(...response.output);

    const functionCalls = response.output.filter(
        item => item.type === "function_call"
    );

    if (functionCalls.length === 0) {
        console.log(response.output_text ?? "Agent finished without a final message.");
        break;
    }

    for (const call of functionCalls) {
        const args = JSON.parse(call.arguments ?? "{}");
        console.log(`> tool: ${call.name}`);

        const result = await executeTool(call.name, args);

        input.push({
            type: "function_call_output",
            call_id: call.call_id,
            name: call.name,
            output: JSON.stringify(result)
        });
    }

    const latestReport = path.join(root, ".ai", "validation-report.json");

    if (fs.existsSync(latestReport)) {
        const report = JSON.parse(fs.readFileSync(latestReport, "utf8"));

        if (report.success === true) {
            console.log("\nAgent validation: PASS");
            console.log(JSON.stringify(report, null, 2));
            console.log("\nAgent finished successfully.");
            process.exit(0);
        }
    }
}

console.error(`\nAgent stopped after ${maxIterations} iterations without validation success.`);
process.exit(1);
