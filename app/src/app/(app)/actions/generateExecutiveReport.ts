"use server";

import { prisma, verifyAuthorization } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Fetch Weekly Metrics for Executive Report.
 * Replaces Supabase RPC 'get_weekly_agency_metrics'.
 */
async function getWeeklyAgencyMetrics() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 1. Total Intakes
    const totalIntakes = await prisma.intake.count();

    // 2. Pending Follow-ups
    const pendingFollowups = await prisma.followUp.count({
        where: { status: 'pending' }
    });

    // 3. New Clients this week
    const newClients = await prisma.client.count({
        where: { createdAt: { gte: oneWeekAgo } }
    });

    // 4. Intakes per day (Aggregation)
    const intakes = await prisma.intake.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        select: { createdAt: true }
    });

    const dailyIntakes = intakes.reduce((acc: Record<string, number>, curr) => {
        const day = curr.createdAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});

    return {
        totalIntakes,
        pendingFollowups,
        newClients,
        dailyIntakes,
        averageVolume: Number.parseFloat((totalIntakes / 7).toFixed(2))
    };
}

/**
 * Server Action: Generate Executive Summary for Agency Leadership.
 */
export async function generateExecutiveReportAction() {
    const auth = await verifyAuthorization(['admin']);
    if (!auth.authorized) {
        throw new Error('Unauthorized: Admin access required');
    }

    try {
        const metrics = await getWeeklyAgencyMetrics();

        // 2. Construct AI prompt based on metrics
        const prompt = `Generate a high-level executive summary for an intake agency based on the following weekly metrics:
        - Total Intakes: ${metrics.totalIntakes}
        - Pending Follow-ups: ${metrics.pendingFollowups}
        - New Clients: ${metrics.newClients}
        - Avg Daily Volume: ${metrics.averageVolume}
        - Daily Breakdown: ${JSON.stringify(metrics.dailyIntakes)}
        
        Focus on trends, operational risks, and staffing recommendations.`;

        // 3. Call AI Service (Unified)
        const { aiService } = await import('@/lib/ai/UnifiedAIService');
        const summary = await aiService.ask({
            prompt,
            temperature: 0.3,
            maxTokens: 1000
        });

        revalidatePath('/dashboard');
        
        return {
            success: true,
            summary,
            metrics
        };

    } catch (error) {
        console.error('Failed to generate executive report:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
