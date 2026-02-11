import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
    console.log('🚀 Starting Relational Backfill...');

    // 1. Fetch all intakes
    const { data: intakes, error: fetchError } = await supabase
        .from('intakes')
        .select('id, data');

    if (fetchError) {
        console.error('Error fetching intakes:', fetchError);
        return;
    }

    console.log(`Found ${intakes?.length || 0} intakes to process.`);

    for (const intake of intakes || []) {
        const d = intake.data as any;
        if (!d) continue;

        console.log(`Processing intake: ${intake.id}`);

        // A. Migrate Identity
        if (d.clientName || d.birthDate || d.ssnLastFour) {
            const nameParts = (d.clientName || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { error: identityError } = await supabase
                .from('intake_identity')
                .upsert({
                    intake_id: intake.id,
                    first_name: firstName,
                    last_name: lastName,
                    date_of_birth: d.birthDate || null,
                    ssn_last_four: d.ssnLastFour || null,
                    phone: d.phone || null,
                    email: d.email || null,
                    address: d.address || null,
                    gender: d.gender || null,
                    race: d.race || null
                });

            if (identityError) console.error(` [Identity Error] ${intake.id}:`, identityError.message);
        }

        // B. Migrate Barriers
        if (Array.isArray(d.barriers)) {
            for (const barrierKey of d.barriers) {
                // Find barrier ID
                const { data: barrierData } = await supabase
                    .from('barriers')
                    .select('id')
                    .eq('key', barrierKey)
                    .single();

                if (barrierData) {
                    const { error: barrierMapError } = await supabase
                        .from('intake_barriers')
                        .upsert({
                            intake_id: intake.id,
                            barrier_id: barrierData.id,
                            source: 'client'
                        });
                    if (barrierMapError) console.error(` [Barrier Error] ${intake.id}:`, barrierMapError.message);
                }
            }
        }

        // C. Initialize Sections
        const sections = ['Identity', 'Evaluation', 'Goals', 'Prep', 'Placement', 'Review'];
        for (const section of sections) {
            await supabase
                .from('intake_sections')
                .upsert({
                    intake_id: intake.id,
                    section_name: section,
                    status: 'in_progress' // Defaulting to in_progress for legacy data
                }, { onConflict: 'intake_id,section_name' });
        }
    }

    console.log('✅ Backfill Complete.');
}

backfill().catch(console.error);
