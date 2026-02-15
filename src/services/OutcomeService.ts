import { createClient } from '@/lib/supabase/browser';

export interface OutcomeMeasure {
    id: string;
    name: string;
    description?: string;
    unit: string;
    min_value?: number;
    max_value?: number;
    is_active: boolean;
}

export interface OutcomeRecord {
    id: string;
    case_id: string;
    measure_id: string;
    value: number;
    recorded_at: string;
    notes?: string;
    recorded_by?: string;
}

export interface OutcomeMetrics {
    total_placements: number;
    avg_wage: number;
    retention_rates: {
        day_30: number;
        day_60: number;
        day_90: number;
    };
    wage_growth: number;
}

class OutcomeServiceImpl {
    private supabase = createClient();

    // --- Legacy / Clinical Outcomes ---

    async getMeasures(): Promise<OutcomeMeasure[]> {
        const { data, error } = await this.supabase
            .from('outcome_measures')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Error fetching outcome measures:', error);
            return [];
        }
        return data || [];
    }

    async getOutcomeHistory(caseId: string): Promise<OutcomeRecord[]> {
        const { data, error } = await this.supabase
            .from('outcome_records')
            .select('*')
            .eq('case_id', caseId)
            .order('recorded_at', { ascending: true });

        if (error) {
            console.error('Error fetching outcome history:', error);
            return [];
        }
        return data || [];
    }

    async logOutcome(payload: { case_id: string; measure_id: string; value: number; notes?: string }): Promise<void> {
        const { error } = await this.supabase
            .from('outcome_records')
            .insert({
                case_id: payload.case_id,
                measure_id: payload.measure_id,
                value: payload.value,
                notes: payload.notes
            });

        if (error) throw error;
    }

    // --- Economic Impact / System Outcomes ---

    async getMetrics(startDate?: Date, endDate?: Date): Promise<OutcomeMetrics> {
        const { data, error } = await this.supabase.rpc('get_outcome_metrics', {
            start_date: startDate?.toISOString(),
            end_date: endDate?.toISOString()
        });

        if (error) {
            console.error('Error fetching outcome metrics:', error);
            throw error;
        }

        // Handle potential mock data structure wrapping
        const metrics = Array.isArray(data) ? data[0] : data;

        return {
            total_placements: metrics?.total_placements || 0,
            avg_wage: metrics?.avg_wage || 0,
            retention_rates: {
                day_30: metrics?.retention_rates?.day_30 || 0,
                day_60: metrics?.retention_rates?.day_60 || 0,
                day_90: metrics?.retention_rates?.day_90 || 0
            },
            wage_growth: metrics?.wage_growth || 0
        };
    }
}

export const outcomeService = new OutcomeServiceImpl();
export const OutcomeService = outcomeService; // Export as both class-like object and instance to satisfy imports
