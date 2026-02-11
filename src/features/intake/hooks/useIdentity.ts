import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { saveIdentityAction } from '@/app/actions/identityActions';
import { IdentityData } from '@/features/intake/types/intake';

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

            if (!intake) {
                // If this is a new intake, we might not have a record yet
                if (intakeId !== 'new') {
                    throw new Error('Intake not found');
                }

                // For 'new' intake, initialize with empty/default state
                setData({
                    clientName: '',
                    ssnLastFour: '',
                    phone: '',
                    email: '',
                    address: '',
                    birthDate: '',
                    gender: '',
                    race: '',
                    reportDate: new Date().toISOString().split('T')[0],
                    completionDate: '',
                    sectionStatus: 'not_started',
                    relationshipStatus: '',
                    preferredContactMethods: [],
                    employmentStatus: '',
                    emergencyContactName: '',
                    emergencyContactPhone: '',
                    emergencyContactRelation: '',
                    referralSource: '',
                    referralContact: ''
                });
                return;
            }

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

                birthDate: relational?.date_of_birth || jsonData.birthDate || '',
                gender: relational?.gender || jsonData.gender || '',
                race: relational?.race || jsonData.race || '',

                reportDate: intake.report_date || '',
                completionDate: intake.completion_date || '',
                sectionStatus: section?.status || 'not_started',

                // Satisfy other Identity sub-types
                relationshipStatus: jsonData.relationshipStatus || '',
                preferredContactMethods: jsonData.preferredContactMethods || [],
                employmentStatus: jsonData.employmentStatus || '',
                emergencyContactName: jsonData.emergencyContactName || '',
                emergencyContactPhone: jsonData.emergencyContactPhone || '',
                emergencyContactRelation: jsonData.emergencyContactRelation || '',
                referralSource: relational?.referral_source || jsonData.referralSource || '',
                referralContact: relational?.referral_contact || jsonData.referralContact || ''
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

    const saveIdentity = async (startData?: Partial<IdentityData>) => {
        if (!intakeId) return { success: false, error: 'No intake ID' };
        setSaving(true);
        try {
            // Local merge if startData provided
            const payload = { ...data, ...startData };

            const { saveIdentityAction } = await import('@/app/actions/identityActions');

            // SME: Map hook identity state to relational action params
            const result = await saveIdentityAction(intakeId, {
                // IdentityBasic
                clientName: payload?.clientName,
                phone: payload?.phone,
                email: payload?.email,
                address: payload?.address,
                ssnLastFour: payload?.ssnLastFour,

                // IdentityDemographics
                birthDate: payload?.birthDate,
                gender: payload?.gender,
                race: payload?.race,

                // Metadata
                sectionStatus: payload?.sectionStatus || 'in_progress'
            } as any);

            if (result.success) {
                // If the save was successful, refresh the data to get the latest from DB
                // Or just update local state to avoid flicker?
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
