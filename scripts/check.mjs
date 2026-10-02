import { execSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");

let hasFailure = false;

function runCheck(name, command, cwd) {
    console.log(`\n=== ${name} ===`);
    console.log(`> ${command}`);

    try {
        execSync(command, {
            cwd,
            stdio: "inherit",
            shell: true
        });

        console.log(`✓ ${name}: PASS`);
        return "PASS";
    } catch {
        console.log(`✗ ${name}: FAIL`);
        hasFailure = true;
        return "FAIL";
    }
}

function runOptionalCheck(name, command, cwd, isConfigured) {
    console.log(`\n=== ${name} ===`);

    if (!isConfigured) {
        console.log(`- ${name}: NOT_CONFIGURED`);
        return "NOT_CONFIGURED";
    }

    return runCheck(name, command, cwd);
}

// Frontend
runCheck(
    "Frontend lint",
    "npm run lint",
    frontendDir
);

runCheck(
    "Frontend build",
    "npm run build",
    frontendDir
);

// Backend
runCheck(
    "Backend typecheck",
    "npx tsc --noEmit",
    backendDir
);

// Backend tests
runOptionalCheck(
    "Backend tests",
    "npm test",
    backendDir,
    true
);

console.log("\n==============================");

if (hasFailure) {
    console.log("VALIDATION FAILED");
    process.exit(1);
}

console.log("VALIDATION PASSED");