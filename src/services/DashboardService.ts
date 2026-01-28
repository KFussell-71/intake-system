import { dashboardRepository, DashboardRepository } from '../repositories/DashboardRepository';

export class DashboardService {
    constructor(private readonly repo: DashboardRepository = dashboardRepository) { }

    async getStats() {
        return await this.repo.getClientStats();
    }
}

export const dashboardService = new DashboardService();
