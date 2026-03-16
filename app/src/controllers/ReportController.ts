import { reportRepository, ReportRepository } from '../repositories/ReportRepository';

export class ReportController {
    constructor(private readonly repo: ReportRepository = reportRepository) { }

    async getReadinessTrend() {
        try {
            const data = await this.repo.getReadinessTrend();
            return { success: true, data };
        } catch (error) {
            console.error('Trend fetch error:', error);
            return { success: false, error: 'Failed to fetch trend' };
        }
    }

    async getMonthlyVolume() {
        try {
            const data = await this.repo.getMonthlyIntakeVolume();
            return { success: true, data };
        } catch (error) {
            console.error('Volume fetch error:', error);
            return { success: false, error: 'Failed to fetch volume' };
        }
    }

    async getDemographics() {
        try {
            const data = await this.repo.getDemographics();
            return { success: true, data };
        } catch (error) {
            console.error('Demographics fetch error:', error);
            return { success: false, error: 'Failed to fetch demographics' };
        }
    }

    async getPlacementOutcomes() {
        try {
            const data = await this.repo.getPlacementOutcomes();
            return { success: true, data };
        } catch (error) {
            console.error('Placement outcomes fetch error:', error);
            return { success: false, error: 'Failed to fetch outcomes' };
        }
    }
}

export const reportController = new ReportController();
