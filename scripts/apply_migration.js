
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Client } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
    const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

    // If request is HTTP (supabase url), pg client won't work.
    // We need a postgres:// URL.
    if (!connectionString || connectionString.startsWith('http')) {
        console.error("Error: DATABASE_URL (postgres://...) is required for migration.");
        console.error("Found:", connectionString);
        process.exit(1);
    }

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        const migrationPath = path.join(__dirname, '../supabase/migrations/20260215180000_portal_support.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log(`Applying migration: ${path.basename(migrationPath)}`);
        await client.query(sql);

        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Error applying migration:", err);
    } finally {
        await client.end();
    }
}

applyMigration();
