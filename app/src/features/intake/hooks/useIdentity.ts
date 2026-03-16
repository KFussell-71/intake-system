'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveIdentityAction, getIdentityAction } from '@/app/(app)/actions/identityActions';
import { IdentityData } from '@/features/intake/intakeTypes';

/**
 * useIdentity Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Prisma data fetching.
 * This hook is now fully session-aware and utilizes the unified security model.
 */
export function useIdentity(intakeId: string) {
    const [data, setData] = useState<IdentityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIdentity = useCallback(async () => {
        if (!intakeId) return;
        try {
            setLoading(true);
            const result = await getIdentityAction(intakeId);
            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch identity');
            }
        } catch (err: any) {
            console.error('Error fetching identity:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchIdentity();
    }, [fetchIdentity]);

    const saveIdentity = async (startData?: Partial<IdentityData>) => {
        if (!intakeId) return { success: false, error: 'No intake ID' };
        setSaving(true);
        try {
            const payload = { ...data, ...startData };
            const result = await saveIdentityAction(intakeId, payload as any);

            if (result.success) {
                if (startData) {
                    setData(prev => prev ? ({ ...prev, ...startData }) : null);
                }
                await fetchIdentity();
            } else {
                setError(result.error);
            }
            return result;
        } catch (err: any) {
            console.error('Error saving identity:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const updateField = useCallback((name: string, value: any) => {
        setData(prev => prev ? ({ ...prev, [name]: value }) : null);
    }, []);

    const saveDraft = async () => {
        return await saveIdentity();
    };

    return {
        data,
        loading,
        saving,
        error,
        updateField,
        saveIdentity,
        saveDraft,
        refresh: fetchIdentity
    };
}
