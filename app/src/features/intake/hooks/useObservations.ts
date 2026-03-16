'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
    addObservationAction, 
    removeObservationAction,
    getObservationsAction 
} from '@/app/(app)/actions/observationActions';
import { updateIntakeSection } from '@/app/(app)/actions/modernizedIntakeActions';

export interface Observation {
    id: string;
    domain: string;
    value: string;
    source: 'client' | 'counselor' | 'document';
    confidence: string | null;
    observed_at: string;
    author_user_id: string | null;
}

/**
 * useObservations Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Prisma data fetching.
 * This ensures that clinical observations are handled through the unified security model.
 */
export function useObservations(intakeId: string) {
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const fetchObservations = useCallback(async () => {
        if (!intakeId) return;
        try {
            setLoading(true);
            const result = await getObservationsAction(intakeId);
            if (result.success) {
                setObservations(result.data as any || []);
            } else {
                setError(result.error || 'Failed to fetch observations');
            }
        } catch (err: any) {
            console.error('Error fetching observations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchObservations();
    }, [fetchObservations]);

    const addObservation = async (domain: string, value: string, source: 'client' | 'counselor' | 'document') => {
        if (!intakeId) return { success: false, error: 'No intake ID' };
        try {
            setAdding(true);
            const newObs = await addObservationAction(intakeId, domain, value, source);
            
            // Map the result if needed or just re-fetch
            const mappedObs: Observation = {
                ...newObs,
                observed_at: newObs.createdAt.toISOString(),
                author_user_id: newObs.authorUserId
            };
            
            setObservations(prev => [mappedObs, ...prev]);
            return { success: true };
        } catch (err: any) {
            console.error('Error adding observation:', err);
            return { success: false, error: err.message };
        } finally {
            setAdding(false);
        }
    };

    const removeObservation = async (id: string) => {
        if (!intakeId) return;
        try {
            // Optimistic update
            setObservations(prev => prev.filter(o => o.id !== id));
            await removeObservationAction(intakeId, id);
        } catch (err: any) {
            console.error('Error removing observation:', err);
            fetchObservations();
        }
    };

    const setSectionStatus = async (status: 'in_progress' | 'complete') => {
        try {
            setLoading(true);
            await updateIntakeSection(intakeId, 'observations', status);
            return { success: true };
        } catch (err: any) {
            console.error('Error updating status:', err);
            setError("Failed to update status.");
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        observations,
        loading,
        adding,
        error,
        addObservation,
        removeObservation,
        setSectionStatus,
        refresh: fetchObservations
    };
}
