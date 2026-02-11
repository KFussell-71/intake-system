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
        const { data: intakes, error } = await this.db
            .from('intakes')
            .select('created_at, data')
            .order('created_at', { ascending: true });

        if (error) this.handleError(error, 'getReadinessTrend');
        if (!intakes) return [];

        // Aggregate by month and calculate average readiness score
        // For now, let's assume 'readiness_score' is a field or we calculate it from prep flags
        const monthlyScores: Record<string, { total: number, count: number }> = {};

        intakes.forEach(intake => {
            const date = new Date(intake.created_at);
            const month = date.toLocaleString('default', { month: 'short' });

            // Calculate a score from 1-10 based on completed prep items
            let score = 5; // Base score
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
    }

    async getMonthlyIntakeVolume(): Promise<number[]> {
        const { data, error } = await this.db
            .from('intakes')
            .select('created_at');

        if (error) this.handleError(error, 'getMonthlyIntakeVolume');
        if (!data) return [0, 0, 0, 0, 0, 0];

        const counts = new Array(6).fill(0);
        const now = new Date();

        data.forEach(item => {
            const date = new Date(item.created_at);
            const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
            if (monthDiff >= 0 && monthDiff < 6) {
                counts[5 - monthDiff]++;
            }
        });

        return counts;
    }

    async getDemographics(): Promise<{ employed: number; unemployed: number }> {
        // Pull demographics from the relational 'intake_identity' table 
        // fallback to data JSON if needed
        const { data, error } = await this.db
            .from('intake_identity')
            .select('employment_status');

        if (error) {
            console.error('Error in getDemographics:', error);
            // Fallback to data blob check (legacy)
            const { data: legacyData } = await this.db.from('intakes').select('data');
            let employed = 0;
            let unemployed = 0;
            legacyData?.forEach(item => {
                if ((item.data as any).employmentStatus === 'employed') employed++;
                else unemployed++;
            });
            return { employed, unemployed };
        }

        let employed = data.filter(d => d.employment_status === 'employed').length;
        let unemployed = data.filter(d => d.employment_status === 'unemployed').length;

        return { employed, unemployed };
    }

    async getAverageApprovalTime(): Promise<string> {
        const { data, error } = await this.db
            .from('intakes')
            .select('created_at, updated_at')
            .eq('status', 'approved');

        if (error || !data || data.length === 0) return "0 Hours";

        const times = data.map(i => {
            const start = new Date(i.created_at).getTime();
            const end = new Date(i.updated_at).getTime();
            return (end - start) / (1000 * 60 * 60); // Hours
        });

        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        return `${avg.toFixed(1)} Hours`;
    }

    async getPlacementOutcomes(): Promise<{ name: string; value: number }[]> {
        const { data, error } = await this.db
            .from('job_placements')
            .select('title');

        if (error) this.handleError(error, 'getPlacementOutcomes');
        if (!data) return [];

        const distributions: Record<string, number> = {};
        data.forEach(item => {
            const title = item.title || 'General Employment';
            distributions[title] = (distributions[title] || 0) + 1;
        });

        return Object.entries(distributions)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }
}

export const reportRepository = new ReportRepository();
