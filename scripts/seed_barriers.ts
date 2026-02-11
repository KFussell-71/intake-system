import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('Falling back to .env');
    dotenv.config({ path: '.env', override: true }); // override if needed, or just append
}

console.log('ENV DEBUG:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    cwd: process.cwd()
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_BARRIERS = [
    { key: 'transportation_car', display: 'Lack of reliable vehicle', category: 'transportation' },
    { key: 'transportation_license', display: 'Suspended/No License', category: 'transportation' },
    { key: 'transportation_public', display: 'No public transit access', category: 'transportation' },
    { key: 'housing_homeless', display: 'Currently Homeless', category: 'housing' },
    { key: 'housing_unstable', display: 'At risk of eviction', category: 'housing' },
    { key: 'childcare_cost', display: 'Cannot afford childcare', category: 'family' },
    { key: 'criminal_record_felony', display: 'Felony Conviction', category: 'legal' },
    { key: 'health_mental', display: 'Untreated Mental Health', category: 'health' },
    { key: 'health_physical', display: 'Physical Disability Limit', category: 'health' },
    { key: 'education_ged', display: 'Lack of GED/Diploma', category: 'education' },
    { key: 'tech_access', display: 'No computer/internet access', category: 'technology' },
    { key: 'language_english', display: 'Limited English Proficiency', category: 'communication' }
];

async function seedBarriers() {
    console.log('🌱 Seeding Master Barriers...');

    for (const barrier of DEFAULT_BARRIERS) {
        const { error } = await supabase
            .from('barriers')
            .upsert(barrier, { onConflict: 'key' });

        if (error) {
            console.error(`❌ Failed to seed barrier ${barrier.key}:`, error.message);
        } else {
            console.log(`✅ Seeded: ${barrier.display}`);
        }
    }

    console.log('✨ Seeding Complete!');
}

seedBarriers().catch(console.error);
