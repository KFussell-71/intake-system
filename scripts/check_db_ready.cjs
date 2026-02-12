
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error("Could not find .env.local at", envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config. URL:', !!supabaseUrl, 'Key:', !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking database readiness...');

    // Check 'cases'
    const { error } = await supabase.from('cases').select('id').limit(1);

    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.error('❌ Table "cases" does NOT exist.');
            process.exit(1);
        }
        console.log('⚠️ Error checking "cases":', error.message);
    } else {
        console.log('✅ Table "cases" exists.');
    }

    // Check 'outcome_measures'
    const { error: omError } = await supabase.from('outcome_measures').select('id').limit(1);
    if (omError && omError.code === '42P01') {
        console.error('❌ Table "outcome_measures" does NOT exist.');
        process.exit(1);
    } else {
        console.log('✅ Table "outcome_measures" exists.');
    }

    console.log('🎉 Database seems ready for use!');
}

check();
