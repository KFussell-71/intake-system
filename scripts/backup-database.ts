#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Exports critical tables to JSON for backup purposes.
 * Run manually or via GitHub Actions.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to backup
const TABLES = [
    'clients',
    'intakes',
    'client_assignments',
    'supervisor_actions',
    'profiles',
    'notifications'
];

async function backupDatabase() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = join(process.cwd(), 'backups', timestamp);

    // Create backup directory
    mkdirSync(backupDir, { recursive: true });

    console.log(`📦 Starting database backup: ${timestamp}\n`);

    for (const table of TABLES) {
        try {
            console.log(`  Backing up ${table}...`);

            const { data, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`  ❌ Error backing up ${table}:`, error.message);
                continue;
            }

            const filename = join(backupDir, `${table}.json`);
            writeFileSync(filename, JSON.stringify(data, null, 2));

            console.log(`  ✅ Backed up ${table}: ${data?.length || 0} records`);
        } catch (error) {
            console.error(`  ❌ Exception backing up ${table}:`, error);
        }
    }

    console.log(`\n✅ Backup complete! Files saved to: ${backupDir}`);
}

backupDatabase().catch(error => {
    console.error('❌ Backup failed:', error);
    process.exit(1);
});
