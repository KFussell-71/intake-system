#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function banner() {
    console.clear();
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                                                            ║', 'cyan');
    log('║        🚀 New Beginning Outreach - Intake Portal 🚀       ║', 'bright');
    log('║                                                            ║', 'cyan');
    log('║              Beginner-Friendly Setup Wizard                ║', 'cyan');
    log('║                                                            ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    log('\n');
}

async function checkNodeVersion() {
    log('📋 Step 1/6: Checking system requirements...', 'blue');

    const nodeVersion = process.versions.node;
    const majorVersion = parseInt(nodeVersion.split('.')[0]);

    log(`   ✓ Node.js version: ${nodeVersion}`, 'green');

    if (majorVersion < 20) {
        log('\n❌ ERROR: Node.js version 20 or higher is required!', 'red');
        log('\n📥 Please install Node.js 20+ from: https://nodejs.org/', 'yellow');
        log('   After installation, run this setup again.\n', 'yellow');
        process.exit(1);
    }

    log('   ✓ Node.js version is compatible!', 'green');

    // Check npm
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
        log(`   ✓ npm version: ${npmVersion}`, 'green');
    } catch (error) {
        log('   ⚠️  npm not found (this is unusual)', 'yellow');
    }

    log('');
}

async function chooseSetupMode() {
    log('📋 Step 2/6: Choose your setup mode...', 'blue');
    log('');
    log('   We offer two modes:', 'cyan');
    log('   1. 🎮 DEMO MODE (Recommended for first-time users)', 'green');
    log('      • Works completely offline', 'cyan');
    log('      • No database setup required', 'cyan');
    log('      • Perfect for testing and learning', 'cyan');
    log('      • Uses mock data (not saved permanently)', 'cyan');
    log('');
    log('   2. 🌐 PRODUCTION MODE (For real deployment)', 'magenta');
    log('      • Requires Supabase account (free tier available)', 'cyan');
    log('      • Data persists in cloud database', 'cyan');
    log('      • Full authentication and security', 'cyan');
    log('      • Requires internet connection', 'cyan');
    log('');

    const mode = await question('   Which mode would you like? (1 for Demo, 2 for Production): ');
    log('');

    return mode.trim() === '2' ? 'production' : 'demo';
}

async function setupEnvironment(mode) {
    log('📋 Step 3/6: Configuring environment...', 'blue');

    if (fs.existsSync('.env.local')) {
        log('   ℹ️  .env.local already exists', 'yellow');
        const overwrite = await question('   Do you want to reconfigure? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            log('   ✓ Keeping existing configuration', 'green');
            log('');
            return;
        }
    }

    let envContent = '';

    if (mode === 'demo') {
        log('   🎮 Setting up DEMO MODE...', 'green');
        envContent = `# Demo Mode Configuration
# This mode runs completely offline with mock data

NEXT_PUBLIC_ALLOW_MOCK_AUTH=true
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Add real credentials later to switch to production mode
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`;
        log('   ✓ Demo mode configured!', 'green');
        log('   ℹ️  You can switch to production mode later by editing .env.local', 'cyan');
    } else {
        log('   🌐 Setting up PRODUCTION MODE...', 'magenta');
        log('');
        log('   📚 You\'ll need a Supabase account. Don\'t have one?', 'cyan');
        log('   1. Go to: https://supabase.com', 'cyan');
        log('   2. Click "Start your project"', 'cyan');
        log('   3. Create a free account', 'cyan');
        log('   4. Create a new project', 'cyan');
        log('   5. Go to Settings → API to find your credentials', 'cyan');
        log('');

        const hasSupabase = await question('   Do you have your Supabase credentials ready? (y/n): ');

        if (hasSupabase.toLowerCase() !== 'y') {
            log('');
            log('   ℹ️  No problem! Let\'s use DEMO MODE for now.', 'yellow');
            log('   You can switch to production mode later.', 'yellow');
            log('');

            envContent = `# Demo Mode Configuration (Temporary)
# Switch to production by adding your Supabase credentials below

NEXT_PUBLIC_ALLOW_MOCK_AUTH=true
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add your Supabase credentials here when ready:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`;
        } else {
            log('');
            const url = await question('   🔗 Supabase URL (e.g., https://xyz.supabase.co): ');
            const anonKey = await question('   🔑 Supabase Anon Key: ');

            envContent = `# Production Mode Configuration
NEXT_PUBLIC_SUPABASE_URL=${url.trim()}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.trim()}
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Add these for additional features
# GEMINI_API_KEY=your_gemini_api_key
# SENTRY_DSN=your_sentry_dsn
`;
            log('   ✓ Production credentials saved!', 'green');
        }
    }

    fs.writeFileSync('.env.local', envContent);
    log('   ✓ .env.local created successfully!', 'green');
    log('');
}

async function installDependencies() {
    log('📋 Step 4/6: Installing dependencies...', 'blue');
    log('   ⏳ This may take 1-3 minutes depending on your internet speed...', 'yellow');
    log('');

    try {
        // Check if node_modules exists
        if (fs.existsSync('node_modules')) {
            log('   ℹ️  node_modules folder already exists', 'yellow');
            const reinstall = await question('   Do you want to reinstall dependencies? (y/n): ');
            if (reinstall.toLowerCase() !== 'y') {
                log('   ✓ Skipping dependency installation', 'green');
                log('');
                return;
            }
        }

        execSync('npm install', { stdio: 'inherit' });
        log('');
        log('   ✓ All dependencies installed successfully!', 'green');
        log('');
    } catch (error) {
        log('');
        log('   ❌ Failed to install dependencies', 'red');
        log('   💡 Try running "npm install" manually', 'yellow');
        log('');
        process.exit(1);
    }
}

async function databaseSetupGuide(mode) {
    if (mode === 'demo') {
        log('📋 Step 5/6: Database setup...', 'blue');
        log('   ✓ Demo mode doesn\'t require database setup!', 'green');
        log('   ℹ️  Your data will be stored in memory (not permanent)', 'cyan');
        log('');
        return;
    }

    log('📋 Step 5/6: Database setup guide...', 'blue');
    log('');
    log('   🗄️  IMPORTANT: You need to set up your database tables', 'yellow');
    log('');
    log('   📝 Follow these steps:', 'cyan');
    log('   1. Open your Supabase Dashboard: https://app.supabase.com', 'cyan');
    log('   2. Select your project', 'cyan');
    log('   3. Go to: SQL Editor (in the left sidebar)', 'cyan');
    log('   4. Click "New Query"', 'cyan');
    log('   5. Open the file "schema.sql" in this folder', 'cyan');
    log('   6. Copy ALL the contents and paste into the SQL Editor', 'cyan');
    log('   7. Click "Run" to execute the SQL', 'cyan');
    log('   8. Wait for "Success" message', 'cyan');
    log('');

    const completed = await question('   Have you completed the database setup? (y/n): ');

    if (completed.toLowerCase() !== 'y') {
        log('');
        log('   ⚠️  Warning: The app won\'t work properly without database setup!', 'yellow');
        log('   💡 You can run the setup later and come back to this step', 'cyan');
        log('');
    } else {
        log('   ✓ Database setup confirmed!', 'green');
        log('');
    }
}

async function finalSteps(mode) {
    log('📋 Step 6/6: Final setup...', 'blue');
    log('');
    log('   ✅ Setup is complete!', 'green');
    log('');

    if (mode === 'demo') {
        log('   🎮 DEMO MODE is ready!', 'green');
        log('');
        log('   📚 Quick Start Guide:', 'cyan');
        log('   • The app will open at: http://localhost:3000', 'cyan');
        log('   • Login with: staff@newbeginning.org', 'cyan');
        log('   • Password: password', 'cyan');
        log('   • All data is temporary (resets on restart)', 'cyan');
        log('');
    } else {
        log('   🌐 PRODUCTION MODE is ready!', 'green');
        log('');
        log('   📚 Quick Start Guide:', 'cyan');
        log('   • The app will open at: http://localhost:3000', 'cyan');
        log('   • Create your first user account', 'cyan');
        log('   • Data persists in your Supabase database', 'cyan');
        log('');
    }

    log('   💡 Useful Commands:', 'yellow');
    log('   • npm run dev     - Start development server', 'cyan');
    log('   • npm run build   - Build for production', 'cyan');
    log('   • npm start       - Run production build', 'cyan');
    log('   • npm test        - Run tests', 'cyan');
    log('');

    const start = await question('   ▶️  Would you like to start the application now? (y/n): ');

    if (start.toLowerCase() === 'y') {
        log('');
        log('   🚀 Starting the application...', 'green');
        log('   📱 Opening browser at http://localhost:3000', 'cyan');
        log('');
        log('   ⚠️  Press Ctrl+C to stop the server', 'yellow');
        log('');
        log('═'.repeat(60), 'cyan');
        log('');

        // Start the dev server
        const devServer = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });

        // Open browser after a delay
        setTimeout(() => {
            const openCommand = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
            try {
                execSync(`${openCommand} http://localhost:3000`, { stdio: 'ignore' });
            } catch (err) {
                // Silently fail if browser can't be opened
            }
        }, 3000);

        devServer.on('close', (code) => {
            log('');
            log('   👋 Application stopped', 'yellow');
            log('   💡 Run "npm run dev" to start again', 'cyan');
            log('');
            rl.close();
            process.exit(code);
        });
    } else {
        log('');
        log('   ✨ All done!', 'green');
        log('   💡 Run "npm run dev" whenever you\'re ready to start', 'cyan');
        log('');
        log('   📖 Need help? Check README.md for more information', 'yellow');
        log('');
        rl.close();
    }
}

async function main() {
    try {
        banner();

        log('👋 Welcome! This wizard will help you set up the Intake Portal.', 'bright');
        log('   Don\'t worry - we\'ll guide you through every step!\n', 'cyan');

        await question('   Press ENTER to begin...');
        console.log('');

        await checkNodeVersion();
        const mode = await chooseSetupMode();
        await setupEnvironment(mode);
        await installDependencies();
        await databaseSetupGuide(mode);
        await finalSteps(mode);

    } catch (error) {
        log('');
        log('💥 Unexpected error during setup:', 'red');
        log(`   ${error.message}`, 'red');
        log('');
        log('💡 Please report this issue or try running setup again', 'yellow');
        log('');
        rl.close();
        process.exit(1);
    }
}

main();
