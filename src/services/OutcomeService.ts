import { supabase } from '@/lib/supabase';

export interface OutcomeMeasure {
    id: string;
    name: string;
    description: string;
    unit: string;
    min_value: number;
    max_value: number;
}

export interface OutcomeRecord {
    id: string;
    case_id: string;
    measure_id: string;
    value: number;
    recorded_at: string;
    notes?: string;
    measure?: OutcomeMeasure;
    recorded_by?: string;
}

export class OutcomeService {
    /**
     * Get all active outcome measures
     */
    async getMeasures(): Promise<OutcomeMeasure[]> {
        const { data, error } = await supabase
            .from('outcome_measures')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data as OutcomeMeasure[];
    }

    /**
     * Get outcome history for a case
     */
    async getOutcomeHistory(caseId: string): Promise<OutcomeRecord[]> {
        const { data, error } = await supabase
            .from('outcome_records')
            .select(`
                *,
                measure:outcome_measures(name, unit, min_value, max_value)
            `)
            .eq('case_id', caseId)
            .order('recorded_at', { ascending: true }); // Ascending for charts

        if (error) throw error;
        return data as any;
    }

    /**
     * Record a new outcome
     */
    async logOutcome(data: { case_id: string; measure_id: string; value: number; notes?: string }): Promise<OutcomeRecord> {
        const { data: result, error } = await supabase
            .from('outcome_records')
            .insert({
                case_id: data.case_id,
                measure_id: data.measure_id,
                value: data.value,
                notes: data.notes,
                recorded_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }
}

export const outcomeService = new OutcomeService();
