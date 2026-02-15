'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { simulationRepository } from '@/repositories/SimulationRepository';

/**
 * Server Action: Get available policies for simulation.
 */
export async function getPoliciesAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const policies = await simulationRepository.getPolicies();
        return { success: true, data: policies };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Run the "Chess Engine".
 */
export async function runPolicySimulationAction(policyId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const result = await simulationRepository.runSimulation(policyId);
        return { success: true, data: result };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
