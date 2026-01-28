import { supabase } from '@/lib/supabase';

export class DashboardRepository {
    async getClientStats() {
        // In a real app, these would be actual queries
        const { count: totalClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });

        const { count: completedIntakes } = await supabase
            .from('intakes')
            .select('*', { count: 'exact', head: true })
            .not('completion_date', 'is', null);

        return {
            totalClients: totalClients || 0,
            completed: completedIntakes || 0,
            inProgress: (totalClients || 0) - (completedIntakes || 0),
            efficiency: (totalClients || 0) > 0
                ? Math.round(((completedIntakes || 0) / (totalClients || 1)) * 100)
                : 0
        };
    }
}

export const dashboardRepository = new DashboardRepository();
