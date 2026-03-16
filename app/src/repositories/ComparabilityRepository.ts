import { BaseRepository } from '@/repositories/BaseRepository';

export interface NormalizationResult {
    canonical_key: string;
    canonical_name: string;
    total_count: number;
    local_breakdown: Record<string, number>;
}

/**
 * ComparabilityRepository
 * MIGRATED TO PRISMA
 * 
 * Aggregates local data (barriers, etc) into canonical "Gold Standard" buckets
 * for cross-state and institutional intelligence.
 */
export class ComparabilityRepository extends BaseRepository {

    /**
     * getNormalizedMetrics
     * Aggregates local data mapped to canonical keys.
     * Replaces the legacy Postgres RPC with a structured Prisma query + post-process.
     * 
     * @param category - e.g., 'BARRIERS', 'OUTCOMES'
     */
    async getNormalizedMetrics(category: string): Promise<NormalizationResult[]> {
        try {
            // 1. Fetch raw data from intake_barriers joined with local barrier definitions
            // This mirrors the RPC logic: intake_barriers -> barriers
            const rawBarriers = await this.db.intakeBarrier.findMany({
                include: {
                    barrier: {
                        select: { name: true }
                    }
                }
            });

            // 2. Fetch all mappings for this category
            const mappings = await this.db.metricMapping.findMany({
                where: {
                    canonical: { category: category }
                },
                include: {
                    canonical: {
                        select: { key: true, name: true }
                    }
                }
            });

            // 3. Normalized aggregation (in-memory for stability since we don't have SQL RPC anymore)
            const resultsMap: Record<string, NormalizationResult> = {};

            for (const rb of rawBarriers) {
                const localTerm = rb.barrier.name;
                const mapping = mappings.find(m => m.localTerm === localTerm);

                if (mapping) {
                    const cKey = mapping.canonical.key;
                    
                    if (!resultsMap[cKey]) {
                        resultsMap[cKey] = {
                            canonical_key: cKey,
                            canonical_name: mapping.canonical.name,
                            total_count: 0,
                            local_breakdown: {}
                        };
                    }

                    resultsMap[cKey].total_count++;
                    resultsMap[cKey].local_breakdown[localTerm] = (resultsMap[cKey].local_breakdown[localTerm] || 0) + 1;
                }
            }

            return Object.values(resultsMap);
        } catch (error: any) {
            this.handleError(error, 'ComparabilityRepository.getNormalizedMetrics');
        }
    }
}

export const comparabilityRepository = new ComparabilityRepository();
