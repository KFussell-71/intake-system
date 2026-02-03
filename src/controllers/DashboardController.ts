import { dashboardService, DashboardService } from '../services/DashboardService';

export class DashboardController {
    constructor(private readonly service: DashboardService = dashboardService) { }

    async getStats() {
        try {
            const stats = await this.service.getStats();
            return { success: true, data: stats };
        } catch (error) {
            console.error('Dashboard stats fetch error:', error);
            return {
                success: false,
                data: null, // Ensure consistent return shape if needed, or handle in component
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

export const dashboardController = new DashboardController();
