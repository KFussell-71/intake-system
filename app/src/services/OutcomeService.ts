import { prisma } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';

export interface OutcomeMeasure {
    id: string;
    name: string;
    description?: string;
    unit?: string;
    min_value?: number;
    max_value?: number;
    is_active: boolean;
}

export interface OutcomeRecord {
    id: string;
    case_id: string;
    measure_id: string;
    value: number;
    recorded_at: string;
    notes?: string;
    recorded_by?: string;
}

export interface OutcomeMetrics {
    total_placements: number;
    avg_wage: number;
    retention_rates: {
        day_30: number;
        day_60: number;
        day_90: number;
    };
    wage_growth: number;
}

class OutcomeServiceImpl {
    private get db() {
        return prisma;
    }

    // --- Legacy / Clinical Outcomes ---

    async getMeasures(): Promise<OutcomeMeasure[]> {
        try {
            const data = await this.db.outcomeMeasure.findMany({
                where: { active: true },
                orderBy: { name: 'asc' }
            });

            return data.map(m => ({
                id: m.id,
                name: m.name,
                description: m.description || undefined,
                is_active: m.active,
                unit: (m as any).unit || '' // Fallback for schema mismatch
            }));
        } catch (error) {
            console.error('Error fetching outcome measures:', error);
            return [];
        }
    }

    async getOutcomeHistory(caseId: string): Promise<OutcomeRecord[]> {
        try {
            const data = await this.db.outcomeRecord.findMany({
                where: { caseId },
                orderBy: { recordedAt: 'asc' }
            });

            return data.map(r => ({
                id: r.id,
                case_id: r.caseId,
                measure_id: r.outcomeMeasureId,
                value: Number(r.value),
                recorded_at: r.recordedAt.toISOString(),
                notes: r.notes || undefined,
                recorded_by: r.recordedBy || undefined
            }));
        } catch (error) {
            console.error('Error fetching outcome history:', error);
            return [];
        }
    }

    async logOutcome(payload: { case_id: string; measure_id: string; value: number; notes?: string }): Promise<void> {
        try {
            await this.db.outcomeRecord.create({
                data: {
                    caseId: payload.case_id,
                    outcomeMeasureId: payload.measure_id,
                    value: new Prisma.Decimal(payload.value),
                    notes: payload.notes
                }
            });
        } catch (error) {
            console.error('Error logging outcome:', error);
            throw error;
        }
    }

    // --- Economic Impact / System Outcomes ---

    async getMetrics(startDate?: Date, endDate?: Date): Promise<OutcomeMetrics> {
        try {
            // Using Prisma $queryRaw for the complex SQL function call
            const startStr = startDate?.toISOString() || null;
            const endStr = endDate?.toISOString() || null;

            const result: any = await this.db.$queryRaw`SELECT * FROM get_outcome_metrics(${startStr}, ${endStr})`;

            const metrics = Array.isArray(result) ? result[0] : result;

            return {
                total_placements: metrics?.total_placements || 0,
                avg_wage: metrics?.avg_wage || 0,
                retention_rates: {
                    day_30: metrics?.retention_rates?.day_30 || 0,
                    day_60: metrics?.retention_rates?.day_60 || 0,
                    day_90: metrics?.retention_rates?.day_90 || 0
                },
                wage_growth: metrics?.wage_growth || 0
            };
        } catch (error) {
            console.error('Error fetching outcome metrics:', error);
            // Return fallback zeros instead of crashing
            return {
                total_placements: 0,
                avg_wage: 0,
                retention_rates: { day_30: 0, day_60: 0, day_90: 0 },
                wage_growth: 0
            };
        }
    }
}

export const outcomeService = new OutcomeServiceImpl();
export const OutcomeService = outcomeService; 
