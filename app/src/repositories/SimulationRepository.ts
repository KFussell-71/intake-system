import { BaseRepository } from '@/repositories/BaseRepository';
import { prisma as db } from '@/lib/auth/authHelpersServer';

export interface PolicyDefinition {
    id: string;
    name: string;
    description: string;
    rules: Record<string, any>;
    active: boolean;
}

export interface SimulationResult {
    policy_name: string;
    cases_analyzed: number;
    baseline_failure_rate: number;
    simulated_failure_rate: number;
    impact_summary: {
        delta: number;
        rule_days?: number;
    };
}

export class SimulationRepository extends BaseRepository {

    /**
     * getPolicies
     * Fetches all active policy definitions for the simulator dropdown.
     */
    async getPolicies(): Promise<PolicyDefinition[]> {
        const policies = await db.policyDefinition.findMany({
            where: { active: true },
            orderBy: { name: 'asc' }
        });
        return policies as any;
    }

    /**
     * runSimulation
     * Triggers the "Chess Engine" to re-play history against the selected policy.
     */
    async runSimulation(policyId: string): Promise<SimulationResult> {
        // Using Prisma $queryRaw for the complex SQL function call
        const result = await db.$queryRaw`SELECT * FROM simulate_policy_impact(${policyId})`;

        if (Array.isArray(result) && result.length > 0) {
            return result[0] as SimulationResult;
        }

        return result as unknown as SimulationResult;
    }
}

export const simulationRepository = new SimulationRepository();
