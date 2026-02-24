import fs from "fs";
import path from "path";
import ai from "./UnifiedAIService";

// Load OpenAPI Spec once
const specPath = path.resolve(process.cwd(), "openapi.yaml");
let spec = "";
try {
    spec = fs.readFileSync(specPath, "utf8");
} catch (e) {
    console.warn("⚠️ openapi.yaml not found. Contract Guardian is disabled.");
}

// 1. Validate Payload against Contract
export async function validateIdentity(payload: unknown) {
    if (!spec) return "Spec missing";
    return ai.ask({
        system: "You validate API requests against an OpenAPI contract.",
        prompt: `
OpenAPI:
${spec}

Request:
${JSON.stringify(payload, null, 2)}

Is this valid for PUT /intakes/{id}/identity?
If not, explain why. Return "VALID" if it passes.
`,
        temperature: 0
    });
}

// 2. Detect Schema Drift (CI)
export async function detectSpecDrift(dbSchema: string) {
    if (!spec) return "Spec missing";
    return ai.ask({
        system: "You are a senior systems architect. Compare DB Schema vs OpenAPI Spec.",
        prompt: `
DATABASE SCHEMA:
${dbSchema}

OPENAPI SPEC:
${spec}

Identify any dangerous mismatches where the API promises data the DB cannot store, or vice versa.
Return "SAFE" if no risks found.
`,
        temperature: 0
    });
}

// 3. Generate Test Fixtures
export async function generateFixtures() {
    if (!spec) return "{}";
    return ai.ask({
        system: "Return valid JSON only. No markdown.",
        prompt: `Create a valid IdentityData object based on this schema:\n\n${spec}`,
        temperature: 0.2
    });
}

// 4. Clinical Explanation
export async function explainIdentityToClinician() {
    if (!spec) return "Spec missing";
    return ai.ask({
        system: "Explain for non-technical clinical staff.",
        prompt: `Summarize the data requirements for Identity based on this spec:\n\n${spec}`
    });
}
