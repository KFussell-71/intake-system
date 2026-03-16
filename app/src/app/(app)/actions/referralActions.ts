"use server";

import { ClinicalResourceCoordinator, ReferralPlan } from '@/domain/services/ClinicalResourceCoordinator';
import { verifyAuthorization, prisma } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Generate a localized referral plan for a specific intake.
 * MIGRATED TO PRISMA
 */
export async function generateIntakeReferralPlan(intakeId: string): Promise<ReferralPlan> {
    const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
    if (!authz.authorized || !authz.userId) throw new Error('Unauthorized');

    try {
        // 1. Fetch intake data using Prisma
        const intake = await prisma.intake.findUnique({
            where: { id: intakeId },
            select: { data: true, clientId: true }
        });

        if (!intake) {
            throw new Error(`Intake not found: ${intakeId}`);
        }

        // 2. Generate Plan
        const plan = await ClinicalResourceCoordinator.generateReferralPlan(intake.data, authz.userId);

        // 3. Audit
        await auditService.log({
            userId: authz.userId,
            action: 'CREATE', // Standardized action: Generating a plan is a creation event
            entityType: 'referral_plan',
            entityId: intakeId,
            details: {
                clientId: intake.clientId,
                referralCount: plan.referrals.length,
                matchedCategories: Array.from(new Set(plan.referrals.map(r => r.category)))
            }
        });

        return plan;
    } catch (error: any) {
        console.error('[ReferralActions] Failed to generate plan:', error);
        throw new Error(error.message || 'Failed to generate referral plan');
    }
}
