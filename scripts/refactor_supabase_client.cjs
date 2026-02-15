const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const srcDir = path.join(__dirname, '../src');

// Find all TS/TSX files
const files = globSync(path.join(srcDir, '**/*.{ts,tsx}'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Pattern 1: import ... from '@/lib/supabase/client'
    // We need to change path to '@/lib/supabase/browser'
    // And if 'supabase' is imported, change to 'createClient' and instantiate
    if (content.includes('@/lib/supabase/client')) {
        // Replace path
        content = content.replace(/@\/lib\/supabase\/client/g, '@/lib/supabase/browser');
        modified = true;
    }

    // Check if 'supabase' is in the named imports from 'browser' (previously client)
    // Regex to capture the import block: import { ... } from '@/lib/supabase/browser'
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/supabase\/browser['"]/;
    const match = content.match(importRegex);

    if (match) {
        const imports = match[1].split(',').map(s => s.trim());
        if (imports.includes('supabase')) {
            // Remove 'supabase' from imports
            const newImports = imports.filter(i => i !== 'supabase');
            if (!newImports.includes('createClient')) {
                newImports.push('createClient');
            }

            const newImportStmt = `import { ${newImports.join(', ')} } from '@/lib/supabase/browser'`;
            content = content.replace(match[0], newImportStmt);

            // Inject 'const supabase = createClient();' after imports.
            // Find the end of the last import statement
            const lastImportIndex = content.lastIndexOf('import ');
            const endOfLastImport = content.indexOf('\n', lastImportIndex);

            // Check if already injected (idempotency)
            if (!content.includes('const supabase = createClient()')) {
                // Insert after the changed import line for proximity
                // Actually, just find the browser import line again
                const browserImportRegex = /import\s*\{[^}]+\}\s*from\s*['"]@\/lib\/supabase\/browser['"]/;
                content = content.replace(browserImportRegex, (m) => {
                    return `${m};\nconst supabase = createClient()`;
                });
            }
            modified = true;
        }
    }

    if (modified) {
        console.log(`Refactoring ${file}...`);
        fs.writeFileSync(file, content);
    }
});
