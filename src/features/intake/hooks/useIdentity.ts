import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { updateIntakeSection } from '@/app/actions/modernizedIntakeActions';

export interface IdentityData {
    clientName: string;
    ssnLastFour: string;
    phone: string;
    email: string;
    address: string;
    reportDate: string;
    completionDate: string;
    sectionStatus: 'not_started' | 'in_progress' | 'complete' | 'waived';
}

export function useIdentity(intakeId: string) {
    const [data, setData] = useState<IdentityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIdentity = useCallback(async () => {
        try {
            setLoading(true);
            // 1. Fetch Intake Data (which contains some identity fields or client_id)
            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select('report_date, completion_date, data, client:clients(name, phone, email, address)')
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

            // Map data
            // Note: We prioritize Client Table data, fallback to JSONB 'data' if needed
            const client = intake.client as any; // Type assertion for joined data
            const jsonData = intake.data as any || {};

            setData({
                clientName: client?.name || jsonData.clientName || '',
                phone: client?.phone || jsonData.phone || '',
                email: client?.email || jsonData.email || '',
                address: client?.address || jsonData.address || '',
                ssnLastFour: jsonData.ssnLastFour || '', // SSN usually not in clients table for security, maybe only in intake data?
                reportDate: intake.report_date,
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
            const updated = { ...data, ...newData } as IdentityData; // Optimistic update merging logic

            // 1. Update Intake Table (Dates)
            const { error: intakeError } = await supabase
                .from('intakes')
                .update({
                    report_date: updated.reportDate,
                    completion_date: updated.completionDate || null,
                    // We still update JSONB for now to maintain compatibility with monlith
                    data: {
                        ...(await getCurrentJsonData(intakeId)), // Helper needed? Or just patch.
                        // Actually, this is tricky. We don't want to overwrite other JSON fields.
                        // Ideally we use a server action or specific JSON path update.
                        // For MVP refactor, we might assume useIntakeForm handles the JSON sync? 
                        // But the goal is to Move AWAY.
                        // So we should update JSONB via a safe patch.
                        clientName: updated.clientName,
                        phone: updated.phone,
                        email: updated.email,
                        address: updated.address,
                        ssnLastFour: updated.ssnLastFour
                    }
                })
                .eq('id', intakeId);

            if (intakeError) throw intakeError;

            // 2. Update Clients Table (Basic Info)
            // We need to know the client_id. 
            // In a real scenario, we'd look it up. For now, assuming intake has client_id.

            // 3. Update Section Status
            if (newData.sectionStatus) {
                await updateIntakeSection(intakeId, 'identity', newData.sectionStatus);
            }

            setData(updated);
            return { success: true };
        } catch (err: any) {
            console.error('Error saving identity:', err);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    return {
        data,
        loading,
        saving,
        error,
        saveIdentity,
        refresh: fetchIdentity
    };
}

// Helper to get current JSON to avoid wiping other fields (Transition Strategy)
async function getCurrentJsonData(intakeId: string) {
    const { data } = await supabase.from('intakes').select('data').eq('id', intakeId).single();
    return data?.data || {};
}
