import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envLocalPath });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('Falling back to .env');
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey && serviceKey.length < 20) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY appears to be a placeholder. Ignoring.');
    serviceKey = undefined;
}

const supabaseKey = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('DEBUG KEYS:', {
    url: supabaseUrl,
    keyLength: supabaseKey?.length,
    keyStart: supabaseKey?.substring(0, 5)
});

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    console.log('🚀 Starting Data Migration...');

    // 1. Fetch all intakes with data
    const { data: intakes, error } = await supabase
        .from('intakes')
        .select('*')
        .not('data', 'is', null);

    if (error) {
        console.error('Error fetching intakes:', error);
        return;
    }

    console.log(`Found ${intakes.length} intakes to process.`);

    let processedCount = 0;
    let errorCount = 0;

    // Fetch master barriers map
    const { data: masterBarriers } = await supabase
        .from('barriers')
        .select('*');

    // Create a map of key -> id for fast lookup
    const barrierMap = new Map();
    masterBarriers?.forEach(b => barrierMap.set(b.key, b.id));

    for (const intake of intakes) {
        try {
            const formData = intake.data as any;
            if (!formData) continue;

            // --- A. Migrate Barriers ---
            if (Array.isArray(formData.barriers) && formData.barriers.length > 0) {
                const barriersToInsert = formData.barriers
                    .map((key: string) => {
                        const id = barrierMap.get(key);
                        if (!id) return null;
                        return {
                            intake_id: intake.id,
                            barrier_id: id,
                            source: 'migration',
                            added_at: new Date().toISOString()
                        };
                    })
                    .filter(Boolean);

                if (barriersToInsert.length > 0) {
                    const { error: barrierError } = await supabase
                        .from('intake_barriers')
                        .upsert(barriersToInsert, { onConflict: 'intake_id,barrier_id' });

                    if (barrierError) console.error(`Failed to migrate barriers for ${intake.id}:`, barrierError);
                }
            }

            // --- B. Migrate Observations ---
            if (formData.generalObservations && typeof formData.generalObservations === 'string') {
                // Check if already exists to avoid duplicates (idempotency)
                const { data: existingObs } = await supabase
                    .from('observations')
                    .select('id')
                    .eq('intake_id', intake.id)
                    .eq('domain', 'general')
                    .eq('source', 'counselor')
                    .single();

                if (!existingObs) {
                    const { error: obsError } = await supabase
                        .from('observations')
                        .insert({
                            intake_id: intake.id,
                            domain: 'general',
                            value: formData.generalObservations,
                            source: 'counselor',
                            observed_at: new Date().toISOString()
                        });

                    if (obsError) console.error(`Failed to migrate observations for ${intake.id}:`, obsError);
                }
            }

            processedCount++;
            if (processedCount % 10 === 0) process.stdout.write('.');

        } catch (err) {
            console.error(`Error processing intake ${intake.id}:`, err);
            errorCount++;
        }
    }

    console.log('\n');
    console.log('✅ Migration Complete');
    console.log(`Processed: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
}

migrateData().catch(console.error);
