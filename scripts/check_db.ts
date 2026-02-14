
import path from 'path';
import dotenv from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
const result = dotenv.config({ path: envPath });

import { createClient } from '@supabase/supabase-js';

async function check() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Using Key:', key ? `${key.substring(0, 5)}... (${key.length} chars)` : 'None');

    if (!url || !key) {
        console.error('Missing credentials');
        return;
    }

    const supabase = createClient(url, key);

    console.log('Checking DB directly...');
    const { data: all, error: allError } = await supabase.from('community_resources').select('*');
    if (allError) {
        console.error('Error fetching all:', allError);
    } else {
        console.log(`Found ${all?.length} resources.`);
        if (all && all.length > 0) console.log('Sample:', all[0].name);
    }

    console.log('Testing Search for "Grace"...');
    const { data: search, error: searchError } = await supabase
        .from('community_resources')
        .select('*')
        .ilike('name', '%Grace%');

    if (searchError) {
        console.error('Error searching:', searchError);
    } else {
        console.log(`Search Found ${search?.length} matches.`);
    }
}

check();
