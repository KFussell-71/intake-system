import { BaseRepository } from './BaseRepository';

export interface ReadinessScore {
    date: string;
    score: number;
}

export interface ReportStats {
    monthlyIntakes: number[];
    demographics: {
        employed: number;
        unemployed: number;
    };
    readinessTrend: ReadinessScore[];
}

export class ReportRepository extends BaseRepository {
    async getReadinessTrend(): Promise<ReadinessScore[]> {
        try {
            const intakes = await this.db.intake.findMany({
                select: { createdAt: true, data: true },
                orderBy: { createdAt: 'asc' }
            });

            if (!intakes) return [];

            const monthlyScores: Record<string, { total: number, count: number }> = {};

            intakes.forEach(intake => {
                const date = new Date(intake.createdAt);
                const month = date.toLocaleString('default', { month: 'short' });

                let score = 5;

                if (intake.data && typeof intake.data === 'object') {
                    const prep = (intake.data as any).preEmploymentPrep;
                    if (prep) {
                        if (prep.resumeComplete) score += 2;
                        if (prep.interviewSkills) score += 1;
                        if (prep.jobSearchAssistance) score += 1;
                    }
                    const services = (intake.data as any).supportiveServices;
                    if (services) {
                        if (services.transportation) score += 0.5;
                        if (services.housing) score += 0.5;
                    }
                }

                if (!monthlyScores[month]) {
                    monthlyScores[month] = { total: 0, count: 0 };
                }
                monthlyScores[month].total += Math.min(score, 10);
                monthlyScores[month].count += 1;
            });

            return Object.entries(monthlyScores).map(([month, data]) => ({
                date: month,
                score: Math.round(data.total / data.count)
            }));
        } catch (error: any) {
            this.handleError(error, 'getReadinessTrend');
            return [];
        }
    }

    async getMonthlyIntakeVolume(): Promise<number[]> {
        try {
            const data = await this.db.intake.findMany({
                select: { createdAt: true }
            });

            const counts = new Array(6).fill(0);
            const now = new Date();

            data.forEach(item => {
                const date = new Date(item.createdAt);
                const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
                if (monthDiff >= 0 && monthDiff < 6) {
                    counts[5 - monthDiff]++;
                }
            });

            return counts;
        } catch (error: any) {
            this.handleError(error, 'getMonthlyIntakeVolume');
            return [0, 0, 0, 0, 0, 0];
        }
    }

    async getDemographics(): Promise<{ employed: number; unemployed: number }> {
        try {
            const identities = await this.db.intakeIdentity.findMany({
                select: { employmentStatus: true }
            });

            let employed = identities.filter((d: any) => d.employmentStatus === 'employed').length;
            let unemployed = identities.filter((d: any) => d.employmentStatus === 'unemployed').length;

            return { employed, unemployed };
        } catch (error: any) {
            console.error('Error in getDemographics:', error);
            // Fallback to data blob check (legacy)
            const legacyData = await this.db.intake.findMany({ select: { data: true } });
            let employed = 0;
            let unemployed = 0;
            legacyData?.forEach(item => {
                if ((item.data as any)?.employmentStatus === 'employed') employed++;
                else unemployed++;
            });
            return { employed, unemployed };
        }
    }

    async getAverageApprovalTime(): Promise<string> {
        try {
            const data = await this.db.intake.findMany({
                where: { status: 'approved' },
                select: { createdAt: true, updatedAt: true }
            });

            if (!data || data.length === 0) return "0 Hours";

            const times = data.map(i => {
                const start = new Date(i.createdAt).getTime();
                const end = new Date(i.updatedAt).getTime();
                return (end - start) / (1000 * 60 * 60); // Hours
            });

            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            return `${avg.toFixed(1)} Hours`;
        } catch (error: any) {
            this.handleError(error, 'getAverageApprovalTime');
            return "0 Hours";
        }
    }

    async getPlacementOutcomes(): Promise<{ name: string; value: number }[]> {
        try {
            const data = await this.db.jobPlacement.findMany({
                select: { title: true }
            });

            const distributions: Record<string, number> = {};
            data.forEach(item => {
                const title = item.title || 'General Employment';
                distributions[title] = (distributions[title] || 0) + 1;
            });

            return Object.entries(distributions)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5); // Top 5
        } catch (error: any) {
            this.handleError(error, 'getPlacementOutcomes');
            return [];
        }
    }
}

export const reportRepository = new ReportRepository();
