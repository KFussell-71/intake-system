import { BaseRepository } from './BaseRepository';
import { PostgrestError } from '@supabase/supabase-js';

// Local Type Definitions (until supabase types are fully regenerated)
export interface StaffingModel {
    id: string;
    unit_name: string;
    base_minutes_per_case: number;
    complexity_multiplier: number;
    admin_overhead_percent: number;
    effective_date: string;
    active: boolean;
}

export interface StaffingForecast {
    unit: string;
    projected_load_hours: number;
    required_ftes: number;
    details: {
        cases: number;
        base_mins: number;
        complexity: number;
        overhead_pct: number;
    };
}

export class StaffingRepository extends BaseRepository {

    /**
     * Fetches the currently active staffing model for a given unit.
     */
    async getModel(unitName: string): Promise<StaffingModel | null> {
        const { data, error } = await this.db
            .from('staffing_load_models')
            .select('*')
            .eq('unit_name', unitName)
            .eq('active', true)
            .order('effective_date', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // It's okay if no model is found, return null
            if (error.code === 'PGRST116') return null;
            this.handleError(error, 'StaffingRepository.getModel');
        }

        return data as StaffingModel;
    }

    /**
     * Calls the database function to calculate FTE requirements.
     * This is the "Chess" move - simulation happens in the DB.
     */
    async getForecast(unitName: string, activeCaseCount: number): Promise<StaffingForecast> {
        const { data, error } = await this.db
            .rpc('get_staffing_forecast', {
                target_unit: unitName,
                active_case_count: activeCaseCount
            });

        if (error) this.handleError(error, 'StaffingRepository.getForecast');

        // RPC returns an array, but our function is designed to return one row for a specific unit call
        // However, if the function returns TABLE, Supabase often returns an array.
        // Let's safe guard.
        if (Array.isArray(data) && data.length > 0) {
            return data[0] as StaffingForecast;
        }

        // Fallback or empty if something weird happens, though the function should return row or error
        return data as unknown as StaffingForecast;
    }

    /**
     * Admin method to update or create a new model version.
     * Enforces immutability by creating a new version rather than updating history.
     */
    async updateModel(model: Omit<StaffingModel, 'id' | 'created_at' | 'created_by'>) {
        // 1. Deactivate old models for this unit (if new one is effective now)
        // For simplicity in this demo, we'll just insert a new one.
        // The `get_staffing_forecast` query picks the latest `effective_date`.

        const { data, error } = await this.db
            .from('staffing_load_models')
            .insert({
                unit_name: model.unit_name,
                base_minutes_per_case: model.base_minutes_per_case,
                complexity_multiplier: model.complexity_multiplier,
                admin_overhead_percent: model.admin_overhead_percent,
                effective_date: model.effective_date || new Date().toISOString(),
                active: true
            })
            .select()
            .single();

        if (error) this.handleError(error, 'StaffingRepository.updateModel');
        return data;
    }
}

export const staffingRepository = new StaffingRepository();
