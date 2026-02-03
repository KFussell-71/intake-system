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
}

export const dashboardRepository = new DashboardRepository();
