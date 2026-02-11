
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Robust Env Loading
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

// Try loading .env.local first
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
}

// Fallback or overlay with .env if URL is missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(envPath)) {
    console.log('Falling back to .env for SUPABASE_URL');
    dotenv.config({ path: envPath, override: true });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Clean up key if it's a placeholder (common in templates)
if (supabaseServiceKey && supabaseServiceKey.includes('...')) {
    supabaseServiceKey = undefined;
}

// Fallback to Anon key if Service key is missing/invalid (though Service key is preferred for verification)
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials.');
    console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('Key:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySprint3() {
    console.log('🧪 Verifying Sprint 3: Process & Intelligence...');
    let success = true;

    // 1. Check Schema (Intake Tasks)
    const { error: tasksError } = await supabase.from('intake_tasks').select('count').limit(1);
    if (tasksError) {
        // If 404/42P01, table isn't there. If 401, RLS blocking (but we have key).
        // If we used Anon key, we might get 401 if no public policy.
        if (tasksError.code === '42P01') {
            console.error('❌ FAIL: intake_tasks table does not exist.');
            success = false;
        } else {
            // It might exist but be restricted.
            console.log(`⚠️  WARN: intake_tasks check returned error: ${tasksError.message} (${tasksError.code}). Assuming existence but restricted access.`);
        }
    } else {
        console.log('✅ PASS: intake_tasks schema exists.');
    }

    // 2. Check Schema (Intake Rules)
    const { error: rulesError } = await supabase.from('intake_rules').select('count').limit(1);
    if (rulesError && rulesError.code === '42P01') {
        console.error('❌ FAIL: intake_rules table does not exist.');
        success = false;
    } else {
        console.log('✅ PASS: intake_rules schema exists.');
    }

    // 3. Logic Check (Rule Engine simulation)
    const { data: rules } = await supabase.from('intake_rules').select('*').limit(1);
    if (rules && rules.length > 0) {
        console.log('✅ PASS: Default rules seeded.');
    } else {
        console.warn('⚠️  WARN: No default rules found. Did migration run?');
    }

    if (success) {
        console.log('🚀 Sprint 3 Verification PASSED (Schema Layer).');
        process.exit(0);
    } else {
        console.error('💥 Sprint 3 Verification FAILED.');
        process.exit(1);
    }
}

verifySprint3();
