const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/20260212_secure_notifications.sql'), 'utf8');
        await client.query(sql);
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
