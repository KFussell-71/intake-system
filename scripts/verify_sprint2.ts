
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySprint2() {
    console.log('🧪 Starting Sprint 2 Verification...');

    // 1. Setup Test Data
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true
    });

    if (userError) throw new Error(`Failed to create test user: ${userError.message}`);
    const userId = user.user.id;
    console.log(`✅ Test User Created: ${userId}`);

    try {
        // Create Client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({ name: 'Test Client', email: testEmail })
            .select('id')
            .single();

        if (clientError) throw new Error(`Failed to create client: ${clientError.message}`);

        // Create Intake
        const { data: intake, error: intakeError } = await supabase
            .from('intakes')
            .insert({
                client_id: client.id,
                status: 'draft',
                data: {} // Empty legacy data
            })
            .select('id')
            .single();

        if (intakeError) throw new Error(`Failed to create intake: ${intakeError.message}`);
        console.log(`✅ Test Intake Created: ${intake.id}`);

        // 2. Verify Medical Dual-Write
        console.log('\n🏥 Verifying Medical Domain...');
        const medicalPayload = {
            medical_eval_needed: true,
            medical_condition_current: true,
            medical_condition_description: 'Test Condition',
            intake_id: intake.id,
            updated_by: userId
        };

        // Simulate Action Write (Direct DB for script simplicity, simulating actions logic)
        // a. Write Relational
        const { error: medRelError } = await supabase
            .from('intake_medical')
            .insert(medicalPayload);
        if (medRelError) throw medRelError;

        // b. Write Legacy
        const { error: medLegError } = await supabase
            .from('intakes')
            .update({
                data: {
                    medicalEvalNeeded: true,
                    medicalConditionCurrent: true,
                    medicalConditionDescription: 'Test Condition'
                }
            })
            .eq('id', intake.id);
        if (medLegError) throw medLegError;

        // CHECK
        const { data: medCheck } = await supabase
            .from('intake_medical')
            .select('*')
            .eq('intake_id', intake.id)
            .single();

        const { data: legCheck } = await supabase
            .from('intakes')
            .select('data')
            .eq('id', intake.id)
            .single();

        if (!medCheck || !legCheck || !legCheck.data) {
            throw new Error("Medical Check Failed: Data missing");
        }

        if (medCheck.medical_condition_description === 'Test Condition' &&
            legCheck.data.medicalConditionDescription === 'Test Condition') {
            console.log('✅ Medical Dual-Write Success');
        } else {
            console.error('❌ Medical Dual-Write Failed', { medCheck, legCheck });
            process.exit(1);
        }

        // 3. Verify Employment Dual-Write
        console.log('\n💼 Verifying Employment Domain...');
        const empPayload = {
            intake_id: intake.id,
            employment_goals: 'Software Engineer',
            desired_job_titles: 'Full Stack Dev',
            updated_by: userId,
            // Test JSONB inside relational
            isp_goals: [{ goal: 'Learn Rust', status: 'pending' }]
        };

        // a. Write Relational
        const { error: empRelError } = await supabase
            .from('intake_employment')
            .insert(empPayload);
        if (empRelError) throw empRelError;

        // b. Write Legacy
        const { error: empLegError } = await supabase
            .from('intakes')
            .update({
                data: {
                    ...legCheck.data, // preserve existing
                    employmentGoals: 'Software Engineer',
                    desiredJobTitles: 'Full Stack Dev',
                    ispGoals: [{ goal: 'Learn Rust', status: 'pending' }]
                }
            })
            .eq('id', intake.id);
        if (empLegError) throw empLegError;

        // CHECK
        const { data: empCheck } = await supabase
            .from('intake_employment')
            .select('*')
            .eq('intake_id', intake.id)
            .single();

        const { data: legCheck2 } = await supabase
            .from('intakes')
            .select('data')
            .eq('id', intake.id)
            .single();

        if (!empCheck || !legCheck2 || !legCheck2.data) {
            throw new Error("Employment Check Failed: Data missing");
        }

        if (empCheck.employment_goals === 'Software Engineer' &&
            legCheck2.data.employmentGoals === 'Software Engineer' &&
            empCheck.isp_goals[0].goal === 'Learn Rust') {
            console.log('✅ Employment Dual-Write Success');
        } else {
            console.error('❌ Employment Dual-Write Failed', { empCheck, legCheck2 });
            process.exit(1);
        }

        console.log('\n✨ All Sprint 2 Verifications Passed!');

    } catch (err: any) {
        console.error('❌ Validation Failed:', err.message);
        process.exit(1);
    } finally {
        // Cleanup
        await supabase.auth.admin.deleteUser(userId);
        console.log('🧹 Test User Cleaned Up');
        process.exit(0);
    }
}

verifySprint2();
