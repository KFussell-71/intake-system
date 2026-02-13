const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationPath = path.join(__dirname, '../migrations/20260212_rsa911_compliance.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running RSA-911 Compliance Migration...');

    // Using the pg driver directly might be better, but we only have supabase-js easily available? 
    // Wait, previous attempts use a raw SQL execution via rpc or similar if available, 
    // OR we rely on the user to run it via dashboard if they lack direct connection.
    // BUT, let's try to run it via the service role which *might* allow raw SQL execution if we had a function for it.
    // Actually, we don't have a generic "exec_sql" function. 
    // Plan B: We can't easily run DDL via supabase-js client unless we use the Postgres connection string.
    // Let's assume the user provided environment has pg connection string for direct migration?
    // Checking previous context, the user had issues with local connections.

    // STRATEGY: I will output the SQL and ask the user to run it if I can't.
    // But wait, the context said "local migration scripts failed".
    // I will try to use the `pg` library if installed, or just write the file and tell the user.
    // Let's try to use the `pg` library as it is standard in these environments.

    try {
        // Trying to connect via connection string if available
        // If not, we just log the instructions.
        console.log('Migration SQL file created at:', migrationPath);
        console.log('Please execute this SQL in your Supabase Dashboard SQL Editor.');

        // Attempt to read .env to find DATABASE_URL
        const envConfig = require('dotenv').parse(fs.readFileSync('.env.local'));
        if (envConfig.DATABASE_URL) {
            const { Client } = require('pg');
            const client = new Client({
                connectionString: envConfig.DATABASE_URL,
            });
            await client.connect();
            await client.query(sql);
            await client.end();
            console.log('Migration executed successfully via Direct Postgres Connection!');
        } else {
            console.warn('DATABASE_URL not found in .env.local. Cannot run automatically.');
        }

    } catch (err) {
        console.error('Migration execution failed:', err.message);
        console.log('Please manually run the SQL in migrations/20260212_rsa911_compliance.sql');
    }
}

runMigration();
