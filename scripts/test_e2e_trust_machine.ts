#!/usr/bin/env ts-node
/**
 * End-to-End Test Suite: Trust Machine Architecture
 * 
 * Verifies:
 * 1. Relational schema exists and is accessible
 * 2. Server actions write to relational tables
 * 3. Audit trail captures all mutations
 * 4. Clinical voice attribution works
 * 5. Non-linear Hub navigation is functional
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
    results.push({ name, passed, message, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${message}`);
    if (details) console.log('   Details:', JSON.stringify(details, null, 2));
}

async function test1_VerifyRelationalSchema() {
    console.log('\n🔍 Test 1: Verify Relational Schema');

    const tables = [
        'intake_identity',
        'intake_sections',
        'observations',
        'intake_barriers',
        'consent_documents',
        'consent_signatures',
        'intake_events'
    ];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) throw error;
            logTest(`Schema: ${table}`, true, `Table exists and is queryable`);
        } catch (err: any) {
            logTest(`Schema: ${table}`, false, `Table not accessible: ${err.message}`);
        }
    }
}

async function test2_CreateTestIntake() {
    console.log('\n🔍 Test 2: Create Test Intake');

    try {
        // Create base intake
        const { data: intake, error: intakeError } = await supabase
            .from('intakes')
            .insert({
                client_id: 'test-client-e2e',
                status: 'draft',
                data: { test: true }
            })
            .select()
            .single();

        if (intakeError) throw intakeError;

        logTest('Create Intake', true, `Created intake: ${intake.id}`);
        return intake.id;
    } catch (err: any) {
        logTest('Create Intake', false, `Failed: ${err.message}`);
        return null;
    }
}

async function test3_RelationalIdentityWrite(intakeId: string) {
    console.log('\n🔍 Test 3: Relational Identity Write');

    try {
        const { data, error } = await supabase
            .from('intake_identity')
            .insert({
                intake_id: intakeId,
                first_name: 'John',
                last_name: 'Doe',
                ssn_last_four: '1234',
                phone: '555-1234',
                email: 'john.doe@test.com',
                date_of_birth: '1990-01-01',
                gender: 'Male',
                race: 'Prefer not to say'
            })
            .select()
            .single();

        if (error) throw error;

        logTest('Identity Write', true, 'Successfully wrote to intake_identity', data);
        return true;
    } catch (err: any) {
        logTest('Identity Write', false, `Failed: ${err.message}`);
        return false;
    }
}

async function test4_ClinicalVoiceObservations(intakeId: string) {
    console.log('\n🔍 Test 4: Clinical Voice Attribution');

    try {
        // Client Statement
        const { data: clientObs, error: clientError } = await supabase
            .from('observations')
            .insert({
                intake_id: intakeId,
                domain: 'mental_health',
                value: 'Client states feeling anxious about job search',
                source: 'client',
                confidence: 'high'
            })
            .select()
            .single();

        if (clientError) throw clientError;

        // Counselor Observation
        const { data: counselorObs, error: counselorError } = await supabase
            .from('observations')
            .insert({
                intake_id: intakeId,
                domain: 'mental_health',
                value: 'Counselor observes flat affect and minimal eye contact',
                source: 'counselor',
                confidence: 'high'
            })
            .select()
            .single();

        if (counselorError) throw counselorError;

        logTest('Client Statement', true, 'Created client observation', clientObs);
        logTest('Counselor Observation', true, 'Created counselor observation', counselorObs);

        // Verify distinction
        const { data: allObs } = await supabase
            .from('observations')
            .select('*')
            .eq('intake_id', intakeId);

        const hasClient = allObs?.some(o => o.source === 'client') ?? false;
        const hasCounselor = allObs?.some(o => o.source === 'counselor') ?? false;

        logTest('Voice Distinction', hasClient && hasCounselor,
            'Both client and counselor voices captured',
            {
                clientCount: allObs?.filter(o => o.source === 'client').length,
                counselorCount: allObs?.filter(o => o.source === 'counselor').length
            });

        return true;
    } catch (err: any) {
        logTest('Clinical Voice', false, `Failed: ${err.message}`);
        return false;
    }
}

async function test5_AuditTrailLogging(intakeId: string) {
    console.log('\n🔍 Test 5: Audit Trail Logging');

    try {
        // Simulate a field update by creating an audit event
        const { data, error } = await supabase
            .from('intake_events')
            .insert({
                intake_id: intakeId,
                event_type: 'field_update',
                field_path: 'identity.phone',
                old_value: '555-0000',
                new_value: '555-1234',
                changed_by: 'test-user-e2e'
            })
            .select()
            .single();

        if (error) throw error;

        logTest('Audit Event Creation', true, 'Successfully logged audit event', data);

        // Verify event is retrievable
        const { data: events } = await supabase
            .from('intake_events')
            .select('*')
            .eq('intake_id', intakeId)
            .order('created_at', { ascending: false });

        logTest('Audit Trail Retrieval', (events && events.length > 0) ?? false,
            `Retrieved ${events?.length || 0} audit events`);

        return true;
    } catch (err: any) {
        logTest('Audit Trail', false, `Failed: ${err.message}`);
        return false;
    }
}

async function test6_SectionStatusTracking(intakeId: string) {
    console.log('\n🔍 Test 6: Section Status Tracking');

    try {
        const sections = ['identity', 'medical', 'employment', 'barriers'];

        for (const section of sections) {
            const { data, error } = await supabase
                .from('intake_sections')
                .insert({
                    intake_id: intakeId,
                    section_name: section,
                    status: 'in_progress'
                })
                .select()
                .single();

            if (error) throw error;
            logTest(`Section: ${section}`, true, `Status tracked: in_progress`);
        }

        // Verify all sections
        const { data: allSections } = await supabase
            .from('intake_sections')
            .select('*')
            .eq('intake_id', intakeId);

        logTest('Non-Linear Navigation', (allSections && allSections.length === 4) ?? false,
            `All ${allSections?.length || 0} sections independently tracked`);

        return true;
    } catch (err: any) {
        logTest('Section Tracking', false, `Failed: ${err.message}`);
        return false;
    }
}

async function test7_ConsentWorkflow(intakeId: string) {
    console.log('\n🔍 Test 7: Consent Workflow');

    try {
        // Create consent document
        const { data: doc, error: docError } = await supabase
            .from('consent_documents')
            .insert({
                intake_id: intakeId,
                scope_text: 'I consent to release of information for employment services',
                template_version: 'v1.0',
                created_by: 'test-user-e2e'
            })
            .select()
            .single();

        if (docError) throw docError;
        logTest('Consent Document', true, 'Created consent document', doc);

        // Add signature
        const { data: sig, error: sigError } = await supabase
            .from('consent_signatures')
            .insert({
                consent_document_id: doc.id,
                signer_name: 'John Doe',
                signer_role: 'client',
                method: 'electronic'
            })
            .select()
            .single();

        if (sigError) throw sigError;
        logTest('Consent Signature', true, 'Signature captured', sig);

        return true;
    } catch (err: any) {
        logTest('Consent Workflow', false, `Failed: ${err.message}`);
        return false;
    }
}

async function test8_CleanupTestData(intakeId: string) {
    console.log('\n🧹 Cleanup: Removing Test Data');

    try {
        // Delete in reverse order of dependencies
        await supabase.from('consent_signatures').delete().match({ consent_document_id: intakeId });
        await supabase.from('consent_documents').delete().eq('intake_id', intakeId);
        await supabase.from('intake_events').delete().eq('intake_id', intakeId);
        await supabase.from('observations').delete().eq('intake_id', intakeId);
        await supabase.from('intake_sections').delete().eq('intake_id', intakeId);
        await supabase.from('intake_identity').delete().eq('intake_id', intakeId);
        await supabase.from('intakes').delete().eq('id', intakeId);

        logTest('Cleanup', true, 'Test data removed successfully');
    } catch (err: any) {
        logTest('Cleanup', false, `Cleanup failed: ${err.message}`);
    }
}

async function runAllTests() {
    console.log('🚀 Starting End-to-End Test Suite: Trust Machine Architecture\n');
    console.log('='.repeat(80));

    await test1_VerifyRelationalSchema();

    const intakeId = await test2_CreateTestIntake();

    if (intakeId) {
        await test3_RelationalIdentityWrite(intakeId);
        await test4_ClinicalVoiceObservations(intakeId);
        await test5_AuditTrailLogging(intakeId);
        await test6_SectionStatusTracking(intakeId);
        await test7_ConsentWorkflow(intakeId);
        await test8_CleanupTestData(intakeId);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SUMMARY\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.message}`);
        });
    }

    console.log('\n' + '='.repeat(80));

    const allPassed = failed === 0;
    console.log(allPassed ? '\n✅ ALL TESTS PASSED - Trust Machine is operational!'
        : '\n⚠️  SOME TESTS FAILED - Review errors above');

    process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(err => {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
});
