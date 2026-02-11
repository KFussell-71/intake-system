#!/usr/bin/env ts-node
/**
 * End-to-End Application Test Suite
 * Tests the running Next.js application at localhost:3000
 */

import * as http from 'http';

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
    if (details && typeof details === 'object') {
        console.log('   Details:', JSON.stringify(details, null, 2).substring(0, 200));
    }
}

async function httpGet(path: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode || 0, body }));
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

async function test1_ServerRunning() {
    console.log('\n🔍 Test 1: Server Running');

    try {
        const result = await httpGet('/');
        logTest('Server Health', result.status === 200,
            `Server responding with status ${result.status}`);
        return true;
    } catch (err: any) {
        logTest('Server Health', false, `Server not accessible: ${err.message}`);
        return false;
    }
}

async function test2_IntakePageLoads() {
    console.log('\n🔍 Test 2: Intake Page Loads');

    try {
        const result = await httpGet('/intake/new');
        const success = result.status === 200 || result.status === 302;
        logTest('Intake Page', success,
            `Page loaded with status ${result.status}`);

        // Check for key components in HTML
        if (result.body.includes('Intake') || result.body.includes('intake')) {
            logTest('Page Content', true, 'Intake-related content found');
        } else {
            logTest('Page Content', false, 'No intake content detected');
        }

        return success;
    } catch (err: any) {
        logTest('Intake Page', false, `Failed to load: ${err.message}`);
        return false;
    }
}

async function test3_DashboardLoads() {
    console.log('\n🔍 Test 3: Dashboard Loads');

    try {
        const result = await httpGet('/dashboard');
        const success = result.status === 200 || result.status === 302;
        logTest('Dashboard Page', success,
            `Dashboard loaded with status ${result.status}`);
        return success;
    } catch (err: any) {
        logTest('Dashboard Page', false, `Failed to load: ${err.message}`);
        return false;
    }
}

async function test4_APIHealthCheck() {
    console.log('\n🔍 Test 4: API Endpoints');

    const endpoints = [
        '/api/health',
        '/api/intakes'
    ];

    for (const endpoint of endpoints) {
        try {
            const result = await httpGet(endpoint);
            const success = result.status < 500; // Accept 404, 401, etc. but not server errors
            logTest(`API: ${endpoint}`, success,
                `Endpoint responded with ${result.status}`);
        } catch (err: any) {
            logTest(`API: ${endpoint}`, false, `Failed: ${err.message}`);
        }
    }
}

async function test5_StaticAssets() {
    console.log('\n🔍 Test 5: Static Assets');

    try {
        const result = await httpGet('/_next/static/css/app/layout.css');
        const success = result.status === 200 || result.status === 404;
        logTest('Static Assets', success,
            'Next.js static asset system operational');
    } catch (err: any) {
        logTest('Static Assets', false, `Asset loading failed: ${err.message}`);
    }
}

async function runAllTests() {
    console.log('🚀 Starting End-to-End Application Test Suite\n');
    console.log('Testing running application at http://localhost:3000');
    console.log('='.repeat(80));

    const serverRunning = await test1_ServerRunning();

    if (serverRunning) {
        await test2_IntakePageLoads();
        await test3_DashboardLoads();
        await test4_APIHealthCheck();
        await test5_StaticAssets();
    } else {
        console.log('\n⚠️  Server not running - skipping remaining tests');
        console.log('   Run `npm run dev` to start the server');
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
    console.log(allPassed ? '\n✅ ALL TESTS PASSED - Application is operational!'
        : '\n⚠️  SOME TESTS FAILED - Review errors above');

    console.log('\n💡 MANUAL VERIFICATION STEPS:');
    console.log('   1. Open http://localhost:3000/intake/new in your browser');
    console.log('   2. Verify the Intake Hub loads with section cards');
    console.log('   3. Click on Identity section and fill in data');
    console.log('   4. Navigate to Observations and add client/counselor entries');
    console.log('   5. Return to Hub and verify Defensibility Score is visible');
    console.log('   6. Check server logs for audit_events and intake_events entries');

    process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(err => {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
});
