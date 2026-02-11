'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { cookies } from 'next/headers';

/**
 * Server Action: Publish Snapshot (The Aggregator).
 * Calculates the metric and saves it to the air-gapped table.
 */
export async function publishPublicMetricsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');
    // In production, check for Specific Role (e.g. 'admin' or 'public_affairs')

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    try {
        // 1. Get active definitions
        const { data: defs } = await supabase.from('public_metric_definitions').select('*').eq('active', true);
        if (!defs) return { success: false, error: 'No metrics defined' };

        const results = [];

        for (const def of defs) {
            let value = { count: 0 };

            // 2. RUN THE MATH (The "Air Gap" Logic)
            // This is where we query the LIVE tables to get the aggregate.
            // We do NOT expose the live tables to the public API.

            if (def.code === 'INTAKE_VOL_TOTAL') {
                const { count } = await supabase.from('intakes').select('*', { count: 'exact', head: true });
                value = { count: count || 0 };
            }
            else if (def.code === 'AVG_DAYS_TO_SERVICE') {
                // Mock calculation for demo - real would query logs/events
                value = { days: 14.2 };
            }
            else if (def.code === 'BARRIER_DISTRIBUTION') {
                // Mock distribution
                value = {
                    distribution: {
                        'Transportation': 45,
                        'Housing': 30,
                        'Childcare': 15,
                        'Other': 10
                    }
                };
            }

            // 3. WRITE TO SNAPSHOT
            const { data: snapshot, error } = await supabase.from('public_snapshots').insert({
                metric_code: def.code,
                value: value,
                period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), // Start of month
                period_end: new Date().toISOString(),
                published_by: auth.user.id
            }).select().single();

            if (error) console.error('Snapshot failed', error);
            else results.push(snapshot);
        }

        return { success: true, data: results };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Get Public Data (Read Only).
 * Queries ONLY the snapshot table.
 */
export async function getPublicDashboardDataAction() {
    // This action could be unauthenticated if we allowed it, 
    // but for now we'll keep it authed or open based on RLS.
    // Since RLS allows 'anon', we can skip verifyAuthentication() if this is truly public.
    // However, to use the server client we need a cookie context. 

    // For this demo, let's assume we are viewing it as an internal user PREVIEWING the public dashboard.
    // Or if public, we use a service key client (not shown here for safety).

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    try {
        // Get latest snapshot for each metric
        const { data: metrics } = await supabase
            .from('public_metric_definitions')
            .select(`
                *,
                public_snapshots (
                    value,
                    published_at
                )
            `)
            .eq('active', true)
            .order('name');

        // Transform to clean object
        const dashboardData = metrics?.map(m => {
            // Sort snapshots desc
            const latest = m.public_snapshots?.sort((a: any, b: any) =>
                new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            )[0];

            return {
                name: m.name,
                code: m.code,
                display_type: m.display_type,
                value: latest?.value || null,
                last_updated: latest?.published_at || null
            };
        });

        return { success: true, data: dashboardData };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
