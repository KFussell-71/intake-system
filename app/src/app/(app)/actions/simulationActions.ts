'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { simulationRepository } from '@/repositories/SimulationRepository';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Get available policies for simulation.
 * MIGRATED WITH AUDITING
 */
export async function getPoliciesAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const policies = await simulationRepository.getPolicies();
        return { success: true, data: policies };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Run the "Chess Engine" Policy Simulation.
 * MIGRATED WITH AUDITING
 */
export async function runPolicySimulationAction(policyId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const result = await simulationRepository.runSimulation(policyId);

        // Unified Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'EXECUTE',
            entityType: 'policy_simulation',
            entityId: policyId,
            details: { 
                resultStatus: 'completed',
                impactDelta: result?.impact_summary?.delta || 0 
            }
        });

        return { success: true, data: result };
    } catch (err: any) {
        console.error('Simulation Error:', err);
        return { success: false, error: err.message };
    }
}
