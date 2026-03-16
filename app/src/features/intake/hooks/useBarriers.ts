'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
    addIntakeBarrierAction, 
    removeIntakeBarrierAction, 
    updateIntakeSection,
    getBarriersDataAction 
} from '@/app/(app)/actions/modernizedIntakeActions';

export interface Barrier {
    id: number;
    name: string;
    category: string;
    description: string | null;
    active: boolean;
}

export interface IntakeBarrier {
    barrier_id: number;
    source: string;
    notes?: string;
}

/**
 * useBarriers Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with secure Server Actions and Prisma data fetching.
 * This ensures that barrier management is handled through the unified security model.
 */
export function useBarriers(intakeId: string) {
    const [allBarriers, setAllBarriers] = useState<Barrier[]>([]);
    const [selectedBarriers, setSelectedBarriers] = useState<IntakeBarrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!intakeId) return;
        try {
            setLoading(true);
            const result = await getBarriersDataAction(intakeId);
            if (result.success && result.data) {
                setAllBarriers(result.data.allBarriers as any || []);
                setSelectedBarriers(result.data.selectedBarriers as any || []);
            } else {
                setError(result.error || 'Failed to fetch barriers');
            }
        } catch (err: any) {
            console.error('Error fetching barriers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleBarrier = async (barrierId: number, isSelected: boolean) => {
        if (!intakeId) return;
        try {
            setUpdating(barrierId);

            // Optimistic Update
            if (isSelected) {
                const newB: IntakeBarrier = { barrier_id: barrierId, source: 'counselor' };
                setSelectedBarriers(prev => [...prev, newB]);
                await addIntakeBarrierAction(intakeId, barrierId, 'counselor');
            } else {
                setSelectedBarriers(prev => prev.filter(b => b.barrier_id !== barrierId));
                await removeIntakeBarrierAction(intakeId, barrierId);
            }

            // Sync with server if needed or just trust the action
            // await fetchData(); 

        } catch (err: any) {
            console.error('Error toggling barrier:', err);
            fetchData();
            setError("Failed to update barrier. Please try again.");
        } finally {
            setUpdating(null);
        }
    };

    // Grouping helper
    const barriersByCategory = allBarriers.reduce((acc, barrier) => {
        const cat = barrier.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(barrier);
        return acc;
    }, {} as Record<string, Barrier[]>);

    const setSectionStatus = async (status: 'in_progress' | 'complete') => {
        try {
            setLoading(true);
            await updateIntakeSection(intakeId, 'barriers', status);
            return { success: true };
        } catch (err: any) {
            console.error('Error updating status:', err);
            setError("Failed to update status. Please try again.");
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        allBarriers,
        selectedBarriers,
        barriersByCategory,
        loading,
        updating,
        error,
        toggleBarrier,
        setSectionStatus,
        refresh: fetchData
    };
}
