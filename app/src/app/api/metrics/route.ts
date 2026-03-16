import { registry, initMetrics } from '@/lib/observability/metrics';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        initMetrics();
        const metrics = await registry.metrics();
        return new NextResponse(metrics, {
            headers: {
                'Content-Type': registry.contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
        });
    } catch (ex) {
        console.error('[METRICS_ERROR]', ex);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Ensure fresh metrics on every scrape
export const dynamic = 'force-dynamic';
