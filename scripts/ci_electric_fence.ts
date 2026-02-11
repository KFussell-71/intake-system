import * as fs from 'fs';
import * as path from 'path';

/**
 * CI Electric Fence
 * 
 * Enforces architectural rules to prevent "God Object" patterns and ensure
 * clinical data integrity during the modernization phase.
 */

const MAX_INTERFACE_FIELDS = 30;
const MAX_FILE_LINES = 400;
const SRC_DIR = path.join(process.cwd(), 'src');

interface Violation {
    file: string;
    rule: string;
    message: string;
}

const violations: Violation[] = [];

function checkFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Rule 1: Max File Lines
    if (lines.length > MAX_FILE_LINES) {
        violations.push({
            file: filePath,
            rule: 'FILE_SIZE_LIMIT',
            message: `File has ${lines.length} lines, exceeding limit of ${MAX_FILE_LINES}.`
        });
    }

    // Rule 2: No Giant Interfaces (Improved to handle nested braces)
    let pos = 0;
    while (true) {
        const startMatch = content.slice(pos).match(/interface\s+(\w+)\s*\{/);
        if (!startMatch) break;

        const interfaceName = startMatch[1];
        const interfaceStart = pos + startMatch.index! + startMatch[0].length;

        // Find matching closing brace
        let depth = 1;
        let i = interfaceStart;
        while (depth > 0 && i < content.length) {
            if (content[i] === '{') depth++;
            if (content[i] === '}') depth--;
            i++;
        }

        const body = content.slice(interfaceStart, i - 1);
        const fieldCount = (body.match(/[:;]/g) || []).length;

        if (fieldCount > MAX_INTERFACE_FIELDS) {
            violations.push({
                file: filePath,
                rule: 'NO_GIANT_INTERFACES',
                message: `Interface '${interfaceName}' contains ~${fieldCount} fields, exceeding limit of ${MAX_INTERFACE_FIELDS}.`
            });
        }

        pos = i;
    }

    // Rule 3: JSONB Swamp Detection (Block new clinical writes to data.obj)
    const jsonbWriteRegex = /\.data(\.|\[['"])(psych|medical|barrier|employment|observation|history|clientName|phone|email|address|ssnLastFour)\w*/gi;
    if (jsonbWriteRegex.test(content)) {
        violations.push({
            file: filePath,
            rule: 'JSONB_SWAMP_DETECTION',
            message: `Found direct write/access to legacy JSONB field. Use relational tables instead.`
        });
    }

    // Rule 4: Audit Requirement
    if (filePath.includes('.actions.') || filePath.includes('Actions.ts')) {
        const hasMutation = content.includes('update') || content.includes('upsert') || content.includes('insert') || content.includes('delete');
        const hasAudit = content.includes('intake_events') || content.includes('logIntakeEvent') || content.includes('logEvent');

        if (hasMutation && !hasAudit) {
            violations.push({
                file: filePath,
                rule: 'AUDIT_REQUIREMENT',
                message: `Mutation detected without visible 'intake_events' or 'logIntakeEvent' logging.`
            });
        }
    }

    // Rule 5: Domain Isolation (No God Object in specialized features)
    if (filePath.includes('src/features/') && !filePath.includes('src/features/intake/types/')) {
        if (content.includes('IntakeFormData') && !filePath.endsWith('.test.ts') && !filePath.endsWith('.spec.ts')) {
            violations.push({
                file: filePath,
                rule: 'DOMAIN_ISOLATION_VIOLATION',
                message: `Domain-specific feature should not import the monolithic 'IntakeFormData'. Use domain-specific interfaces.`
            });
        }
    }

    // Rule 6: Tightened Interface Limits for Domains
    if (filePath.includes('src/features/') && content.includes('interface ')) {
        const DOMAIN_INTERFACE_LIMIT = 15;
        let pos = 0;
        while (true) {
            const startMatch = content.slice(pos).match(/interface\s+(\w+)\s*\{/);
            if (!startMatch) break;

            const interfaceName = startMatch[1];
            const interfaceStart = pos + startMatch.index! + startMatch[0].length;

            let depth = 1;
            let i = interfaceStart;
            while (depth > 0 && i < content.length) {
                if (content[i] === '{') depth++;
                if (content[i] === '}') depth--;
                i++;
            }

            const body = content.slice(interfaceStart, i - 1);
            const fieldCount = (body.match(/:/g) || []).length;

            if (fieldCount > DOMAIN_INTERFACE_LIMIT) {
                violations.push({
                    file: filePath,
                    rule: 'DOMAIN_INTERFACE_LIMIT',
                    message: `Domain interface '${interfaceName}' has ${fieldCount} fields, exceeding limit of ${DOMAIN_INTERFACE_LIMIT}.`
                });
            }
            pos = i;
        }
    }
}

function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'agents') {
                walkDir(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            // Exclude auto-generated or large external-ish types
            if (filePathExcludes.some(exclude => fullPath.includes(exclude))) {
                continue;
            }
            checkFile(fullPath);
        }
    }
}

const filePathExcludes = [
    'src/types/supabase.ts',
    'src/lib/agents/',
];

console.log('⚡ Starting Electric Fence CI Checks...');
walkDir(SRC_DIR);

if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} architectural violations:`);
    violations.forEach(v => {
        console.error(`- [${v.rule}] ${v.file}: ${v.message}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All architectural checks passed.');
    process.exit(0);
}
