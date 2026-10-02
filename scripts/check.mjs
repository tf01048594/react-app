import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");
const reportPath = path.join(root, ".ai", "validation-report.json");

const results = {};
let hasFailure = false;

function runCheck(name, command, cwd, key) {
    console.log(`\n=== ${name} ===`);
    console.log(`> ${command}`);

    try {
        const output = execSync(command, {
            cwd,
            encoding: "utf8",
            shell: true
        });

        if (output) {
            console.log(output);
        }

        console.log(`✓ ${name}: PASS`);
        results[key] = {
            status: "PASS",
            output: output.trim()
        };

        return "PASS";
    } catch (error) {
        const stdout = error.stdout?.toString() ?? "";
        const stderr = error.stderr?.toString() ?? "";
        const output = [stdout, stderr]
            .filter(Boolean)
            .join("\n")
            .trim();

        if (output) {
            console.log(output);
        }

        console.log(`✗ ${name}: FAIL`);

        results[key] = {
            status: "FAIL",
            exitCode: error.status ?? null,
            signal: error.signal ?? null,
            output
        };

        hasFailure = true;

        return "FAIL";
    }
}

function runOptionalCheck(name, command, cwd, key, isConfigured) {
    console.log(`\n=== ${name} ===`);

    if (!isConfigured) {
        console.log(`- ${name}: NOT_CONFIGURED`);

        results[key] = {
            status: "NOT_CONFIGURED"
        };

        return "NOT_CONFIGURED";
    }

    return runCheck(name, command, cwd, key);
}

function getChangedFiles() {
    try {
        const output = execSync(
            "git diff --name-status HEAD",
            {
                cwd: root,
                encoding: "utf8",
                shell: true
            }
        );

        return output
            .trim()
            .split("\n")
            .filter(Boolean)
            .map(line => {
                const [status, ...fileParts] = line.split("\t");

                return {
                    status,
                    file: fileParts.join("\t")
                };
            });
    } catch {
        return [];
    }
}

runCheck(
    "Frontend lint",
    "npm run lint",
    frontendDir,
    "frontendLint"
);

runCheck(
    "Frontend build",
    "npm run build",
    frontendDir,
    "frontendBuild"
);

runCheck(
    "Backend typecheck",
    "npx tsc --noEmit",
    backendDir,
    "backendTypecheck"
);

runOptionalCheck(
    "Backend tests",
    "npm test",
    backendDir,
    "backendTests",
    true
);

const changedFiles = getChangedFiles();

const summary = {
    success: !hasFailure,
    status: hasFailure ? "FAILED" : "PASSED",
    changedFiles,
    results
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(
    reportPath,
    JSON.stringify(summary, null, 2) + "\n",
    "utf8"
);

console.log("\n==============================");

if (hasFailure) {
    console.log("VALIDATION FAILED");
} else {
    console.log("VALIDATION PASSED");
}

console.log("\nValidation summary:");
console.log(JSON.stringify(summary, null, 2));
console.log(`\nMachine-readable report: ${reportPath}`);

process.exit(hasFailure ? 1 : 0);
