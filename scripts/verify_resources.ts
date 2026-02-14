
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Configuration Debug ---');
console.log('Loading .env.local from:', path.resolve(process.cwd(), '.env.local'));
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey);
console.log('---------------------------');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function verifyResources() {
    console.log('Verifying Community Resources...');

    const { count, error } = await supabase
        .from('community_resources')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error querying resources full object:', JSON.stringify(error, null, 2));
        console.error('Error details:', error.message, error.details, error.hint);
        return;
    }

    console.log(`Total Resources Found: ${count}`);

    const { data, error: listError } = await supabase
        .from('community_resources')
        .select('name, category, is_verified')
        .limit(5);

    if (listError) {
        console.error('Error fetching list:', listError);
        return;
    }

    console.log('Sample Resources:');
    data?.forEach(r => {
        console.log(`- [${r.category}] ${r.name} (Verified: ${r.is_verified})`);
    });
}

verifyResources();
