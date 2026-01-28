import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log('\n🚀 Starting New Beginning Outreach Portal Setup...\n');

    // 1. Check Node.js Version
    const nodeVersion = process.versions.node.split('.')[0];
    if (parseInt(nodeVersion) < 20) {
        console.error('❌ Error: Node.js version 20 or higher is required.');
        process.exit(1);
    }

    // 2. Setup Environment Variables
    if (!fs.existsSync('.env.local')) {
        console.log('📝 Setting up your database connection...');
        const url = await question('🔗 Enter your Supabase URL (e.g., https://xyz.supabase.co): ');
        const key = await question('🔑 Enter your Supabase Anon Key: ');

        const envContent = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\nNODE_ENV=development\n`;
        fs.writeFileSync('.env.local', envContent);
        console.log('✅ .env.local created successfully!');
    } else {
        console.log('✅ .env.local already exists. Skipping...');
    }

    // 3. Install Dependencies
    console.log('\n📦 Installing project dependencies (this may take a minute)...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed!');
    } catch (error) {
        console.error('❌ Failed to install dependencies.');
        process.exit(1);
    }

    // 4. Database Reminder
    console.log('\n🗄️  IMPORTANT DATABASE STEP:');
    console.log('1. Go to your Supabase Dashboard -> SQL Editor.');
    console.log('2. Copy the contents of "schema.sql" from this folder.');
    console.log('3. Paste and RUN it to set up your tables and security.');

    // 5. Final Step
    const start = await question('\n▶️  Would you like to start the application now? (y/n): ');
    if (start.toLowerCase() === 'y') {
        process.env.NODE_ENV = 'development';
        execSync('npm run dev', { stdio: 'inherit' });
    } else {
        console.log('\n✨ Setup Complete! Run "npm run dev" whenever you are ready to start.');
        rl.close();
    }
}

setup().catch(err => {
    console.error('💥 Unexpected error during setup:', err);
    process.exit(1);
});
