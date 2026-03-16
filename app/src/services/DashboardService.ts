import { dashboardRepository, DashboardRepository } from '../repositories/DashboardRepository';

export class DashboardService {
    constructor(private readonly repo: DashboardRepository = dashboardRepository) { }

    async getStats() {
        return await this.repo.getDashboardStats();
    }

    async getIntakeTrends(days?: number) {
        return await this.repo.getIntakeTrends(days);
    }

    async getStaffWorkload() {
        return await this.repo.getStaffWorkload();
    }

    async getMyWorkload() {
        return await this.repo.getMyWorkload();
    }

    async getActivityFeed(limit?: number) {
        return await this.repo.getRecentActivity(limit);
    }
}

export const dashboardService = new DashboardService();
