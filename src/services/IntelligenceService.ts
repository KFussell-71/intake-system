import { IntakeFormData } from '@/features/intake/types/intake';

export interface ClinicalInsight {
    type: 'warning' | 'info' | 'critical';
    message: string;
    targetField?: string;
}

export interface PriorityScoreResult {
    score: number; // 0-100
    insights: ClinicalInsight[];
    priorityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class IntelligenceService {
    /**
     * Calculates a clinical priority score for a supervisor review queue.
     * This moves the intake from a simple "list" to a "risk-weighted queue".
     */
    static calculatePriorityScore(data: Partial<IntakeFormData>): PriorityScoreResult {
        let score = 0;
        const insights: ClinicalInsight[] = [];

        // 1. Clinical Complexity vs Documentation Gap (CRITICAL)
        if ((data.medicalEvalNeeded || data.psychEvalNeeded) && !data.clinicalRationale) {
            score += 45;
            insights.push({
                type: 'critical',
                message: 'High clinical risk flagged without professional rationale.',
                targetField: 'clinicalRationale'
            });
        }

        // 2. Eligibility Inconsistency
        if (data.eligibilityDetermination === 'ineligible') {
            score += 30;
            insights.push({
                type: 'warning',
                message: 'Ineligibility determination requires supervisor oversight.'
            });
        }

        // 3. Stale Draft Check
        if (data.status === 'draft' && data.lastSavedAt) {
            const lastSaved = new Date(data.lastSavedAt).getTime();
            const hoursStale = (Date.now() - lastSaved) / (1000 * 60 * 60);
            if (hoursStale > 48) {
                score += 20;
                insights.push({
                    type: 'info',
                    message: `Draft has been stagnant for ${Math.round(hoursStale)} hours.`
                });
            }
        }

        // 4. Identity Gaps
        if (!data.ssnLastFour || data.ssnLastFour === '0000') {
            score += 5;
            insights.push({
                type: 'warning',
                message: 'Incomplete identity verification.',
                targetField: 'ssnLastFour'
            });
        }

        // Normalize score
        score = Math.min(100, score);

        let priorityLevel: PriorityScoreResult['priorityLevel'] = 'Low';
        if (score > 80) priorityLevel = 'Critical';
        else if (score > 50) priorityLevel = 'High';
        else if (score > 25) priorityLevel = 'Medium';

        return {
            score,
            insights,
            priorityLevel
        };
    }

    /**
     * Strategic Aggregate Insights for the Team
     */
    static getTeamStrategicAlerts(workload: any[]): ClinicalInsight[] {
        const alerts: ClinicalInsight[] = [];

        // Mock aggregate logic
        const highRiskCount = workload.filter(w => w.intakes_in_progress > 5).length;
        if (highRiskCount > 0) {
            alerts.push({
                type: 'warning',
                message: `${highRiskCount} specialists are exceeding recommended case velocity limits.`
            });
        }

        return alerts;
    }
}
