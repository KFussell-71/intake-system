import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveIdentityAction, IdentityData } from '@/app/actions/identityActions';

export function useIdentity(intakeId: string) {
    const [data, setData] = useState<IdentityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIdentity = useCallback(async () => {
        try {
            setLoading(true);
            // 1. Fetch Intake Data (Hybrid approach: Try relational first, fall back to JSON)
            // Ideally we join intake_identity.

            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select(`
                    id, 
                    report_date, 
                    completion_date, 
                    data, 
                    client:clients(name, phone, email, address),
                    intake_identity(*)
                `)
                .eq('id', intakeId)
                .single();

            if (intakeError) throw intakeError;

            // 2. Fetch Section Status
            const { data: section } = await supabase
                .from('intake_sections')
                .select('status')
                .eq('intake_id', intakeId)
                .eq('section_name', 'identity')
                .single();

            const client = intake.client as any;
            const jsonData = intake.data as any || {};
            const relational = (intake as any).intake_identity; // Might be null if not migrated yet

            // Priority: Relational -> Client Table -> JSONB
            setData({
                clientName:
                    (relational?.first_name ? `${relational.first_name} ${relational.last_name}` : null) ||
                    client?.name ||
                    jsonData.clientName || '',

                ssnLastFour: relational?.ssn_last_four || jsonData.ssnLastFour || '',
                phone: relational?.phone || client?.phone || jsonData.phone || '',
                email: relational?.email || client?.email || jsonData.email || '',
                address: relational?.address || client?.address || jsonData.address || '',

                reportDate: intake.report_date || '',
                completionDate: intake.completion_date || '',
                sectionStatus: section?.status || 'not_started'
            });

        } catch (err: any) {
            console.error('Error fetching identity:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchIdentity();
    }, [intakeId, fetchIdentity]);

    const saveIdentity = async (newData: Partial<IdentityData>) => {
        try {
            setSaving(true);
            const updated = { ...data, ...newData } as IdentityData;

            // Server Action handles Double Write & Audit
            const result = await saveIdentityAction(intakeId, newData);
            if (!result.success) throw new Error(result.error);

            setData(updated);
            return { success: true };
        } catch (err: any) {
            console.error('Error saving identity:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        // Just save current state as in_progress
        const result = await saveIdentity({ ...data, sectionStatus: 'in_progress' } as any);
        return result;
    };

    return {
        data,
        loading,
        saving,
        error,
        saveIdentity,
        saveDraft, // New
        refresh: fetchIdentity
    };
}
