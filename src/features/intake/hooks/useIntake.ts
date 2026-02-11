
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IntakeData } from '@/features/intake/types/intake';

export interface IntakeRecord {
    id: string;
    client_id: string;
    status: string;
    data: IntakeData;
    created_at: string;
    updated_at: string;
}

export function useIntake(intakeId: string) {
    const [intake, setIntake] = useState<IntakeRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchIntake = async () => {
            if (!intakeId) return;

            setLoading(true);
            const { data, error } = await supabase
                .from('intakes')
                .select('*')
                .eq('id', intakeId)
                .single();

            if (error) {
                console.error('Error fetching intake:', error);
                setError(error.message);
            } else {
                setIntake(data as unknown as IntakeRecord);
            }
            setLoading(false);
        };

        fetchIntake();

        // Subscribe to changes (e.g., if one section updates data, others might need to know for rules)
        const channel = supabase
            .channel(`intake_global_${intakeId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'intakes', filter: `id=eq.${intakeId}` },
                (payload) => {
                    setIntake(payload.new as unknown as IntakeRecord);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [intakeId]);

    return { intake, loading, error };
}
