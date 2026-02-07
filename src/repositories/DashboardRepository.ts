import { supabase } from '@/lib/supabase';
import { DashboardStats, IntakeTrend, StaffWorkload, MyWorkload, ActivityFeedItem } from '@/types/dashboard';

export class DashboardRepository {

    async getMyWorkload(): Promise<MyWorkload | null> {
        const { data, error } = await supabase.rpc('get_my_workload');
        if (error) {
            console.error('Error fetching my workload:', error);
            return null;
        }
        // RPC returns an array of one object
        return data && data.length > 0 ? data[0] : null;
    }

    async getRecentActivity(limit: number = 20): Promise<ActivityFeedItem[]> {
        const { data, error } = await supabase.rpc('get_recent_activity_feed', { limit_count: limit });
        if (error) {
            console.error('Error fetching activity feed:', error);
            return [];
        }
        return data || [];
    }
    async getDashboardStats(): Promise<DashboardStats> {
        const [myWorkload, recentActivity, intakeTrends, staffWorkload] = await Promise.all([
            this.getMyWorkload(),
            this.getRecentActivity(5),
            this.getIntakeTrends(),
            this.getStaffWorkload()
        ]);

        return {
            myWorkload,
            recentActivity,
            intakeTrends,
            staffWorkload
        };
    }

    async getIntakeTrends(days: number = 30): Promise<IntakeTrend[]> {
        const { data, error } = await supabase.rpc('get_intake_trends', { days_count: days });
        if (error) {
            console.error('Error fetching trends:', error);
            // Return empty array on error to prevent crash
            return [];
        }
        return data || [];
    }

    async getStaffWorkload(): Promise<StaffWorkload[]> {
        const { data, error } = await supabase.rpc('get_staff_workload');
        if (error) {
            console.error('Error fetching staff workload:', error);
            return [];
        }
        return data || [];
    }

    async getMonthlyIntakes(): Promise<{ name: string; intakes: number }[]> {
        const { data, error } = await supabase
            .from('intakes')
            .select('created_at')
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }

        const stats: Record<string, number> = {};
        data?.forEach(i => {
            const month = new Date(i.created_at).toLocaleString('default', { month: 'short' });
            stats[month] = (stats[month] || 0) + 1;
        });

        return Object.entries(stats).map(([name, intakes]) => ({ name, intakes }));
    }

    async getRiskProfiling(): Promise<{ name: string; value: number }[]> {
        // Mock for now as Phase 37 Aggregation Table isn't ready
        // Using real counts where possible
        const { count: low } = await supabase.from('intake_assessments').select('id', { count: 'exact', head: true }).lt('ai_risk_score', 50);
        const { count: med } = await supabase.from('intake_assessments').select('id', { count: 'exact', head: true }).gte('ai_risk_score', 50).lt('ai_risk_score', 75);
        const { count: high } = await supabase.from('intake_assessments').select('id', { count: 'exact', head: true }).gte('ai_risk_score', 75);

        return [
            { name: 'Low Risk', value: low || 0 },
            { name: 'Medium Risk', value: med || 0 },
            { name: 'High Risk', value: high || 0 },
        ];
    }
}

export const dashboardRepository = new DashboardRepository();
