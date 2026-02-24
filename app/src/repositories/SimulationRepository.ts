import { BaseRepository } from '@/repositories/BaseRepository';

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
        const { data, error } = await this.db
            .from('policy_definitions')
            .select('*')
            .eq('active', true)
            .order('name');

        if (error) this.handleError(error, 'SimulationRepository.getPolicies');
        return data || [];
    }

    /**
     * runSimulation
     * Triggers the "Chess Engine" to re-play history against the selected policy.
     */
    async runSimulation(policyId: string): Promise<SimulationResult> {
        // RPC call to the SQL engine
        const { data, error } = await this.db
            .rpc('simulate_policy_impact', { target_policy_id: policyId });

        if (error) this.handleError(error, 'SimulationRepository.runSimulation');

        // RPC returns array or single object depending on definition
        if (Array.isArray(data) && data.length > 0) {
            return data[0] as SimulationResult;
        }

        return data as unknown as SimulationResult;
    }
}

export const simulationRepository = new SimulationRepository();
