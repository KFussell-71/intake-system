
const fs = require('fs');

const files = process.argv.slice(2);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Check if it imports supabase from server
    const importRegex = /(import\s+\{.*)supabase(.*\}\s+from\s+'@\/lib\/supabase\/server';)/;
    if (!importRegex.test(content)) {
        return;
    }

    // 2. Replace import "supabase" -> "createClient"
    // We assume it's `import { supabase } ...` or `import { ..., supabase } ...`
    // Replacing just the word 'supabase' in the import line is risky if 'supabase' is part of another word, but unlikely in import block.
    // However, the regex above captures the line.

    let newContent = content.replace(importRegex, (match, p1, p2) => {
        return p1 + 'createClient' + p2;
    });

    // 3. Inject "const supabase = await createClient();" into function bodies
    // We target common async function patterns

    // Standard async function
    const funcRegex = /(export\s+async\s+function\s+\w+\s*\(.*?\)\s*\{)/g;
    newContent = newContent.replace(funcRegex, '$1\n    const supabase = await createClient();');

    // Arrow function
    const arrowRegex = /(export\s+const\s+\w+\s*=\s*async\s*\(.*?\)\s*=>\s*\{)/g;
    newContent = newContent.replace(arrowRegex, '$1\n    const supabase = await createClient();');

    // Default export async function
    const defaultRegex = /(export\s+default\s+async\s+function\s*\w*\s*\(.*?\)\s*\{)/g;
    newContent = newContent.replace(defaultRegex, '$1\n    const supabase = await createClient();');

    // Writes back
    if (newContent !== content) {
        console.log(`Refactoring ${file}...`);
        fs.writeFileSync(file, newContent);
    }
});
