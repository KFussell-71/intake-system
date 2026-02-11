import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { addIntakeBarrierAction, removeIntakeBarrierAction } from '@/app/actions/modernizedIntakeActions';

export interface Barrier {
    id: number;
    key: string;
    display: string;
    category: string;
    active: boolean;
}

export interface IntakeBarrier {
    barrier_id: number;
    source: string;
    notes?: string;
}

export function useBarriers(intakeId: string) {
    const [allBarriers, setAllBarriers] = useState<Barrier[]>([]);
    const [selectedBarriers, setSelectedBarriers] = useState<IntakeBarrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<number | null>(null); // barrierId being updated

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Master List
            const { data: masters, error: masterError } = await supabase
                .from('barriers')
                .select('*')
                .eq('active', true)
                .order('category', { ascending: true });

            if (masterError) throw masterError;

            // 2. Fetch Selected
            const { data: selected, error: selectedError } = await supabase
                .from('intake_barriers')
                .select('*')
                .eq('intake_id', intakeId);

            if (selectedError) throw selectedError;

            setAllBarriers(masters || []);
            setSelectedBarriers(selected || []);

        } catch (err: any) {
            console.error('Error fetching barriers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchData();
    }, [intakeId, fetchData]);

    const toggleBarrier = async (barrierId: number, isSelected: boolean) => {
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

        } catch (err: any) {
            console.error('Error toggling barrier:', err);
            // Revert on error
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

    return {
        allBarriers,
        selectedBarriers,
        barriersByCategory,
        loading,
        updating,
        error,
        toggleBarrier,
        refresh: fetchData
    };
}
