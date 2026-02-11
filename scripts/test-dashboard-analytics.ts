
import { dashboardRepository } from '../src/repositories/DashboardRepository';
import { createClient } from '@supabase/supabase-js';

// Mock DB for local testing if needed, or use real one
// We'll trust the repository uses the global supabase instance

async function testAnalytics() {
    console.log('Testing Dashboard Analytics...');
    try {
        const analytics = await dashboardRepository.getAnalyticsSummary();
        console.log('--- Analytics Summary ---');
        console.log(JSON.stringify(analytics, null, 2));

        if (!analytics.referrals) console.warn('WARNING: Missing referrals data');
        if (!analytics.barriers) console.warn('WARNING: Missing barriers data');

        const trends = await dashboardRepository.getIntakeTrends(30);
        console.log(`--- Trends (${trends.length} days) ---`);
        if (trends.length > 0) console.log(trends[0]);

        console.log('✅ Dashboard Data Fetch Successful');
    } catch (error) {
        console.error('❌ Dashboard Test Failed:', error);
        process.exit(1);
    }
}

testAnalytics();
