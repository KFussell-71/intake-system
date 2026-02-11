
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// --- Configuration ---
const CONFIG = {
    maxLines: 400,
    maxInterfaceLines: 50, // "Giant interface" threshold
    forbiddenPatterns: [
        {
            regex: /data\.(psychHistory|barriers|medical|employment)/,
            message: "⚠️  JSONB Access Detected: Stop! Use the relational hook/action instead."
        },
        {
            regex: /export interface .*FormData/,
            message: "⚠️  Monolithic Interface Detected: separate your domains."
        },
        {
            regex: /fetch.*11434/,
            message: "⛔ Direct AI Access Forbidden: Use UnifiedAIService only."
        },
        {
            regex: /fetch.*openai/,
            message: "⛔ Direct AI Access Forbidden: Use UnifiedAIService only."
        }
    ],
    scanPaths: [
        'src/**/*{.ts,.tsx}'
    ],
    ignorePaths: [
        'src/features/intake/components/ModernizedIntakeWizard.tsx', // The conductor is allowed to be a bit larger
        'src/lib/ai/providers/**', // Trusted infrastructure allowed to call AI
        '**/*.test.ts',
        '**/*.spec.ts'
    ]
};

async function runElectricFence() {
    console.log('⚡ Running CI Electric Fences...');
    let failureCount = 0;

    const files = await glob(CONFIG.scanPaths, { ignore: CONFIG.ignorePaths });

    if (files.length === 0) {
        console.warn('No files found to scan. Check paths.');
        return;
    }

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const relativePath = path.relative(process.cwd(), filePath);

        // Rule 1: File Size
        if (lines.length > CONFIG.maxLines) {
            console.error(`❌ [SIZE] ${relativePath}: ${lines.length} lines (Limit: ${CONFIG.maxLines})`);
            failureCount++;
        }

        // Rule 2: Giant Interfaces
        // Simple heuristic: count lines between 'interface' and '}'
        let interfaceLineStart = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/interface\s+\w+\s+\{/)) {
                interfaceLineStart = i;
            } else if (lines[i].includes('}') && interfaceLineStart !== -1) {
                const height = i - interfaceLineStart;
                if (height > CONFIG.maxInterfaceLines) {
                    console.error(`❌ [COMPLEXITY] ${relativePath}: Interface at line ${interfaceLineStart + 1} is ${height} lines tall (Limit: ${CONFIG.maxInterfaceLines})`);
                    failureCount++;
                }
                interfaceLineStart = -1;
            }
        }

        // Rule 3: Forbidden Patterns
        for (const pattern of CONFIG.forbiddenPatterns) {
            if (pattern.regex.test(content)) {
                console.error(`❌ [PATTERN] ${relativePath}: ${pattern.message}`);
                failureCount++;
            }
        }
    }

    if (failureCount > 0) {
        console.error(`\n💥 Electric Fence Audit FAILED with ${failureCount} violations.`);
        process.exit(1);
    } else {
        console.log('\n✅ Electric Fence Audit PASSED. No smells detected.');
    }
}

runElectricFence().catch(err => {
    console.error(err);
    process.exit(1);
});
