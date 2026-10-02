import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");

const results = {};
let hasFailure = false;

function runCheck(name, command, cwd, key) {
    console.log(`\n=== ${name} ===`);
    console.log(`> ${command}`);

    try {
        execSync(command, {
            cwd,
            stdio: "inherit",
            shell: true
        });

        console.log(`✓ ${name}: PASS`);
        results[key] = {
            status: "PASS"
        };

        return "PASS";
    } catch (error) {
        console.log(`✗ ${name}: FAIL`);

        results[key] = {
            status: "FAIL",
            exitCode: error.status ?? null,
            signal: error.signal ?? null
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

// Frontend
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

// Backend
runCheck(
    "Backend typecheck",
    "npx tsc --noEmit",
    backendDir,
    "backendTypecheck"
);

// Backend tests
runOptionalCheck(
    "Backend tests",
    "npm test",
    backendDir,
    "backendTests",
    true
);

const changedFiles = getChangedFiles();

console.log("\n==============================");

const summary = {
    success: !hasFailure,
    status: hasFailure ? "FAILED" : "PASSED",
    changedFiles,
    results
};

if (hasFailure) {
    console.log("VALIDATION FAILED");
} else {
    console.log("VALIDATION PASSED");
}

console.log("\nValidation summary:");
console.log(JSON.stringify(summary, null, 2));

process.exit(hasFailure ? 1 : 0);