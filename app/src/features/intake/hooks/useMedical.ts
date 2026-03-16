'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveMedicalAction, getMedicalAction } from '@/app/(app)/actions/medicalActions';
import { MedicalData } from '@/features/intake/intakeTypes';

/**
 * useMedical Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Prisma data fetching.
 * Clinical data is fetched from the Intake JSONB container to ensure consistency with the 
 * modernized data model while preserving legacy flexibility.
 */
export function useMedical(intakeId: string) {
    const [data, setData] = useState<MedicalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMedical = useCallback(async () => {
        if (!intakeId) return;
        try {
            setLoading(true);
            const result = await getMedicalAction(intakeId);
            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch medical data');
            }
        } catch (err: any) {
            console.error('Error fetching medical data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchMedical();
    }, [fetchMedical]);

    const saveMedical = async (newData: Partial<MedicalData>) => {
        if (!intakeId) return { success: false, error: 'No intake ID' };
        try {
            setSaving(true);
            
            // Merge with local state for optimistic UI or standard update
            const updated = { ...data, ...newData } as MedicalData;
            setData(updated);

            const result = await saveMedicalAction(intakeId, newData);
            if (!result.success) throw new Error(result.error);

            // Fetch latest to ensure sync
            await fetchMedical();
            
            return { success: true };
        } catch (err: any) {
            console.error('Error saving medical:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        return await saveMedical({ sectionStatus: 'in_progress' } as any);
    };

    return {
        data,
        loading,
        saving,
        error,
        sectionStatus: data?.sectionStatus || 'not_started',
        saveMedical,
        saveDraft,
        refresh: fetchMedical
    };
}
