import { BaseRepository } from '@/repositories/BaseRepository';

export interface NormalizationResult {
    canonical_key: string;
    canonical_name: string;
    total_count: number;
    local_breakdown: Record<string, number>;
}

export class ComparabilityRepository extends BaseRepository {

    /**
     * getNormalizedMetrics
     * Fetches aggregated data mapped to canonical keys.
     * @param category - e.g., 'BARRIERS', 'OUTCOMES'
     */
    async getNormalizedMetrics(category: string): Promise<NormalizationResult[]> {
        const { data, error } = await this.db
            .rpc('get_normalized_metrics', { target_category: category });

        if (error) this.handleError(error, 'ComparabilityRepository.getNormalizedMetrics');
        return data || [];
    }
}

export const comparabilityRepository = new ComparabilityRepository();
