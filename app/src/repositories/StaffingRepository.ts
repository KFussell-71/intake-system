import { BaseRepository } from './BaseRepository';

// Local Type Definitions aligned with Prisma models
export interface StaffingModel {
    id: string;
    unit_name: string;
    base_minutes_per_case: number;
    complexity_multiplier: number;
    admin_overhead_percent: number;
    effective_date: Date;
    active: boolean;
}

export interface StaffingForecast {
    unit: string;
    projected_load_hours: number;
    required_ftes: number;
    details: {
        cases: number;
        base_mins: number;
        complexity: number;
        overhead_pct: number;
    };
}

/**
 * MIGRATED TO PRISMA
 * StaffingRepository handles workload modeling and FTE forecasting.
 */
export class StaffingRepository extends BaseRepository {

    /**
     * Fetches the currently active staffing model for a given unit.
     */
    async getModel(unitName: string): Promise<StaffingModel | null> {
        try {
            const data = await this.db.staffingLoadModel.findFirst({
                where: {
                    unitName: unitName,
                    active: true
                },
                orderBy: {
                    effectiveDate: 'desc'
                }
            });

            if (!data) return null;

            return {
                id: data.id,
                unit_name: data.unitName,
                base_minutes_per_case: data.baseMinutesPerCase,
                complexity_multiplier: Number(data.complexityMultiplier),
                admin_overhead_percent: Number(data.adminOverheadPercent),
                effective_date: data.effectiveDate,
                active: data.active
            };
        } catch (error: any) {
            this.handleError(error, 'StaffingRepository.getModel');
        }
    }

    /**
     * Calculates FTE requirements based on current load.
     * Replaces DB RPC with application-side logic using Prisma-fetched models.
     */
    async getForecast(unitName: string, activeCaseCount: number): Promise<StaffingForecast> {
        try {
            const model = await this.getModel(unitName);
            
            if (!model) {
                // Fallback to default if no model found
                const defaultMins = 45;
                const hours = (activeCaseCount * defaultMins) / 60;
                return {
                    unit: unitName,
                    projected_load_hours: hours,
                    required_ftes: hours / 40,
                    details: {
                        cases: activeCaseCount,
                        base_mins: defaultMins,
                        complexity: 1.0,
                        overhead_pct: 0
                    }
                };
            }

            const complexity = Number(model.complexity_multiplier) || 1;
            const rawMins = activeCaseCount * model.base_minutes_per_case * complexity;
            const overheadMins = rawMins * (model.admin_overhead_percent / 100);
            const totalMins = rawMins + overheadMins;
            const totalHours = totalMins / 60;
            const requiredFtes = totalHours / 40; // Assuming 40hr work week

            return {
                unit: unitName,
                projected_load_hours: Math.round(totalHours * 100) / 100,
                required_ftes: Math.round(requiredFtes * 100) / 100,
                details: {
                    cases: activeCaseCount,
                    base_mins: model.base_minutes_per_case,
                    complexity: model.complexity_multiplier,
                    overhead_pct: model.admin_overhead_percent
                }
            };
        } catch (error: any) {
            this.handleError(error, 'StaffingRepository.getForecast');
        }
    }

    /**
     * Admin method to update or create a new model version.
     */
    async updateModel(model: Omit<StaffingModel, 'id' | 'effective_date' | 'active'>) {
        try {
            return await this.db.$transaction(async (tx: any) => {
                // 1. Deactivate old models
                await tx.staffingLoadModel.updateMany({
                    where: { unitName: model.unit_name, active: true },
                    data: { active: false }
                });

                // 2. Create new model
                return await tx.staffingLoadModel.create({
                    data: {
                        unitName: model.unit_name,
                        baseMinutesPerCase: model.base_minutes_per_case,
                        complexityMultiplier: model.complexity_multiplier,
                        adminOverheadPercent: model.admin_overhead_percent,
                        active: true
                    }
                });
            });
        } catch (error: any) {
            this.handleError(error, 'StaffingRepository.updateModel');
        }
    }
}

export const staffingRepository = new StaffingRepository();
