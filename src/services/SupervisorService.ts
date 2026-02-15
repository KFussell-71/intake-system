
import { createClient } from '@/lib/supabase/server';

export type SupervisorMetrics = {
    stalled_cases: Array<{
        client_name: string;
        case_id: string;
        days_since_contact: number;
        last_contact_date: string;
        assigned_to: string;
    }>;
    compliance_gaps: {
        unsigned_intakes: number;
        overdue_reviews: number;
        missing_docs: number;
    };
    goal_drift: Array<{
        client_name: string;
        goal_description: string;
        target_date: string;
        days_overdue: number;
    }>;
    upcoming_exits: Array<{
        client_name: string;
        exit_date: string;
        days_remaining: number;
    }>;
    pipeline_velocity: Array<{
        stage: string;
        avg_days: number;
        case_count: number;
    }>;
    caseload_stats: Array<{
        staff_email: string;
        active_cases: number;
    }>;
};



export class SupervisorService {
    static async getMetrics(): Promise<SupervisorMetrics> {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_supervisor_metrics');


        if (error) {
            console.error('Error fetching supervisor metrics:', error);
            throw error;
        }

        // Result might be an array with one object or just the object
        const finalData = Array.isArray(data) ? data[0] : data;

        return finalData as SupervisorMetrics;

    }
}
