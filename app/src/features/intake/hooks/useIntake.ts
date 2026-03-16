'use client';

import { useEffect, useState, useCallback } from 'react';
import { getIntakeAction } from '@/app/(app)/actions/intakeActions';
import { IntakeFormData } from '@/features/intake/intakeTypes';

export interface IntakeRecord {
    id: string;
    clientId: string;
    status: string;
    data: any;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * useIntake Hook (Refactored)
 * 
 * Migrated from direct Supabase browser client to secure Server Actions and Polling.
 * Reconstructs the legacy data object for backward compatibility with existing components.
 */
export function useIntake(intakeId: string) {
    const [intake, setIntake] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIntake = useCallback(async (isInitial = false) => {
        if (!intakeId || intakeId === 'new') {
            setLoading(false);
            return;
        }

        if (isInitial) setLoading(true);
        try {
            const result = await getIntakeAction(intakeId);
            if (result.success && result.data) {
                const raw = result.data;
                
                // Reconstruct legacy 'data' object for backward compatibility (Strangle Pattern)
                const legacyData: any = { ...(raw.data as any || {}) };

                // Identity
                const identity = (raw as any).identity; // If present in raw or fetched separately
                // Our Server Action fetches sections, milestones, etc.
                
                if (raw.sections) {
                    raw.sections.forEach((s: any) => {
                        if (s.sectionName === 'identity') {
                            legacyData.identity = { ...legacyData.identity, sectionStatus: s.status };
                        } else if (s.sectionName === 'medical') {
                            legacyData.medical = { ...legacyData.medical, sectionStatus: s.status };
                        }
                    });
                }

                if (raw.observations) {
                    legacyData.clinical_observations = raw.observations.map((o: any) => ({
                        id: o.id,
                        category: o.domain,
                        observation: o.value,
                        source: o.source,
                        confidence: o.confidence
                    }));
                }

                setIntake({
                    ...raw,
                    data: legacyData
                });
            } else {
                setError(result.error || 'Intake not found');
            }
        } catch (err: any) {
            console.error('Error fetching intake:', err);
            setError(err.message);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchIntake(true);

        // POLL FALLBACK: Every 60s for background updates
        // This replaces the direct supabase.channel subscriptions in the browser
        const interval = setInterval(() => {
            fetchIntake(false);
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchIntake]);

    return { intake, loading, error };
}
