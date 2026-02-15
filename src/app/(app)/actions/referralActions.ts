'use server';

import { ClinicalResourceCoordinator, ReferralPlan } from '../../domain/services/ClinicalResourceCoordinator';
import { verifyAuthorization } from '@/lib/auth/authHelpersServer';
import { auditService } from '../../services/auditService';
import { createClient } from '@/lib/supabase/server';

/**
 * Generate a localized referral plan for a specific intake.
 */
export async function generateIntakeReferralPlan(intakeId: string): Promise<ReferralPlan> {
    const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
    if (!authz.authorized) throw new Error('Unauthorized');

    try {
        const supabase = await createClient();

        // 1. Fetch intake data
        const { data: intake, error } = await supabase
            .from('intakes')
            .select('*')
            .eq('id', intakeId)
            .single();

        if (error || !intake) {
            throw new Error(`Intake not found: ${error?.message}`);
        }

        // 2. Generate Plan
        const plan = await ClinicalResourceCoordinator.generateReferralPlan(intake.data, authz.userId!);

        // 3. Audit
        await auditService.log({
            userId: authz.userId!,
            action: 'GENERATE_REFERRAL_PLAN',
            entityType: 'intake',
            entityId: intakeId,
            details: {
                referralCount: plan.referrals.length,
                matchedCategories: Array.from(new Set(plan.referrals.map(r => r.category)))
            }
        });

        return plan;
    } catch (error) {
        console.error('[ReferralActions] Failed to generate plan:', error);
        throw error;
    }
}
