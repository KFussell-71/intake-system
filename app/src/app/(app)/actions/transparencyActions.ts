'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Publish Snapshot (The Aggregator) using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function publishPublicMetricsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const defs = await prisma.publicMetricDefinition.findMany({
            where: { active: true }
        });

        if (defs.length === 0) return { success: false, error: 'No metrics defined' };

        const results = [];

        for (const def of defs) {
            let metricValue: any = { count: 0 };

            if (def.code === 'INTAKE_VOL_TOTAL') {
                const count = await prisma.intake.count();
                metricValue = { count };
            }
            else if (def.code === 'AVG_DAYS_TO_SERVICE') {
                metricValue = { days: 14.2 };
            }
            else if (def.code === 'BARRIER_DISTRIBUTION') {
                metricValue = {
                    distribution: {
                        'Transportation': 45,
                        'Housing': 30,
                        'Childcare': 15,
                        'Other': 10
                    }
                };
            }

            const snapshot = await prisma.$transaction(async (tx: any) => {
                const s = await tx.publicSnapshot.create({
                    data: {
                        metricCode: def.code,
                        value: metricValue,
                        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        periodEnd: new Date(),
                        publishedBy: auth.userId!
                    }
                });

                // 1. Unified Audit Log
                await auditService.log({
                    userId: auth.userId!,
                    action: 'CREATE',
                    entityType: 'public_snapshot',
                    entityId: s.id,
                    details: { metricCode: def.code }
                });

                // 2. Legacy Event (Global Context)
                await tx.intakeEvent.create({
                    data: {
                        intakeId: "00000000-0000-0000-0000-000000000000",
                        eventType: 'metric_published',
                        newValue: def.code,
                        changedBy: auth.userId!,
                        fieldPath: "public_snapshots"
                    }
                });

                return s;
            });

            results.push(snapshot);
        }

        revalidatePath('/transparency');
        return { success: true, data: results };

    } catch (err: any) {
        console.error('Error publishing public metrics:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Get Public Data (Read Only) using Prisma.
 */
export async function getPublicDashboardDataAction() {
    try {
        const metrics = await prisma.publicMetricDefinition.findMany({
            where: { active: true },
            include: {
                snapshots: {
                    orderBy: { publishedAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        });

        const dashboardData = metrics.map(m => {
            const latest = m.snapshots[0];
            return {
                name: m.name,
                code: m.code,
                display_type: m.displayType,
                value: latest?.value || null,
                last_updated: latest?.publishedAt || null
            };
        });

        return { success: true, data: dashboardData };
    } catch (err: any) {
        console.error('Error fetching public dashboard data:', err);
        return { success: false, error: err.message };
    }
}
