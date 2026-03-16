'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveEmploymentAction, getVocationalAction } from '@/app/(app)/actions/employmentActions';
import { VocationalData } from '@/features/intake/intakeTypes';

/**
 * useVocational Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Prisma data fetching.
 * This ensures that vocational/employment data is handled through the unified security model.
 */
export function useVocational(intakeId: string) {
    const [data, setData] = useState<VocationalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchVocational = useCallback(async () => {
        if (!intakeId) return;
        try {
            setLoading(true);
            const result = await getVocationalAction(intakeId);
            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch vocational data');
            }
        } catch (err: any) {
            console.error('Error fetching vocational data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchVocational();
    }, [fetchVocational]);

    const saveVocational = async (newData: Partial<VocationalData>) => {
        if (!intakeId) return { success: false, error: 'No intake ID' };
        try {
            setSaving(true);
            const updated = { ...data, ...newData } as VocationalData;
            
            // Optimistic update
            setData(updated);

            const result = await saveEmploymentAction(intakeId, newData);
            if (!result.success) throw new Error(result.error);

            // Re-fetch to ensure server-side sync
            await fetchVocational();
            
            return { success: true };
        } catch (err: any) {
            console.error('Error saving vocational:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        return await saveVocational({ sectionStatus: 'in_progress' } as any);
    };

    return {
        data,
        loading,
        saving,
        error,
        sectionStatus: data?.sectionStatus || 'not_started',
        saveVocational,
        saveDraft,
        refresh: fetchVocational
    };
}
