import { globSync } from "glob";
import fs from "fs";

let failed = false;

function die(msg, file) {
    console.error(`❌ ${msg}\n   → ${file}`);
    failed = true;
}

console.log("🛡️  Starting Architecture Guard...");

/**
 * Rule 1: no heavy providers in (auth)
 * Pattern: src/app/(auth)/**/*
 * We use glob magic escaping for parenthesis: src / app/*(auth)/**/ * or just src / app / (* auth *)/**/ *
 * Node - glob might require escaping like src / app /\(auth\)
 */
// Try exact match with escaped parenthesis
// In glob, ( ... ) is an extglob pattern.
// To match literal (, escape it.
const authPattern = "src/app/\\(auth\\)/**/*.{ts,tsx}";
const authFiles = globSync(authPattern);

if (authFiles.length === 0) {
    console.warn("⚠️  Warning: No files found in (auth) group. Check glob pattern.");
}

for (const file of authFiles) {
    const text = fs.readFileSync(file, "utf8");
    if (text.includes("AppProviders") || text.includes("GlobalSearch") || text.includes("TrainingProvider")) {
        die("Auth route importing Heavy Providers", file);
    }
}

/**
 * Rule 2: no direct supabase imports
 */
const allFiles = globSync("src/**/*.{ts,tsx}");
for (const file of allFiles) {
    if (file.includes("src/lib/supabase/admin.ts")) continue;

    const text = fs.readFileSync(file, "utf8");
    if (text.includes("@supabase/supabase-js")) {
        die("Direct Supabase import detected (Use @/lib/supabase/browser or server)", file);
    }
}

/**
 * Rule 3: server code inside client files
 */
for (const file of allFiles) {
    const text = fs.readFileSync(file, "utf8");
    if (text.includes('"use client"') || text.includes("'use client'")) {
        if (text.includes("@/lib/supabase/server") || text.includes("/lib/supabase/server")) {
            die("Client component importing server module (@/lib/supabase/server)", file);
        }
    }
}

if (failed) {
    console.error("💥 Architecture Guard FAILED");
    process.exit(1);
}
console.log("✅ Architecture guard passed");
