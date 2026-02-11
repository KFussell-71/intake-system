import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { addIntakeObservation, removeIntakeObservationAction } from '@/app/actions/modernizedIntakeActions';

export interface Observation {
    id: string;
    domain: string;
    value: string;
    source: 'client' | 'counselor' | 'document';
    confidence: string | null;
    observed_at: string;
    author_user_id: string | null;
}

export function useObservations(intakeId: string) {
    const [observations, setObservations] = useState<Observation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const fetchObservations = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('observations')
                .select('*')
                .eq('intake_id', intakeId)
                .order('observed_at', { ascending: false });

            if (error) throw error;
            setObservations(data || []);
        } catch (err: any) {
            console.error('Error fetching observations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchObservations();
    }, [intakeId, fetchObservations]);

    const addObservation = async (domain: string, value: string, source: 'client' | 'counselor' | 'document') => {
        try {
            setAdding(true);
            const newObs = await addIntakeObservation(intakeId, domain, value, source);
            setObservations(prev => [newObs, ...prev]);
            return { success: true };
        } catch (err: any) {
            console.error('Error adding observation:', err);
            return { success: false, error: err.message };
        } finally {
            setAdding(false);
        }
    };

    const removeObservation = async (id: string) => {
        try {
            // Optimistic update
            setObservations(prev => prev.filter(o => o.id !== id));
            await removeIntakeObservationAction(intakeId, id);
        } catch (err: any) {
            console.error('Error removing observation:', err);
            // Revert on error would be complex without re-fetch, so just re-fetch
            fetchObservations();
        }
    };

    return {
        observations,
        loading,
        adding,
        error,
        addObservation,
        removeObservation,
        refresh: fetchObservations
    };
}
