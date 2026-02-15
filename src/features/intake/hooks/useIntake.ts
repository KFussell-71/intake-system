
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { IntakeFormData } from '@/features/intake/intakeTypes';

export interface IntakeRecord {
    id: string;
    client_id: string;
    status: string;
    data: IntakeFormData;
    created_at: string;
    updated_at: string;
}

export function useIntake(intakeId: string) {
    const [intake, setIntake] = useState<IntakeRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchIntakeSlices = async () => {
            if (!intakeId || intakeId === 'new') {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // console.log('Fetching intake slices for:', intakeId);
                const results = await Promise.all([
                    supabase.from('intakes').select('*').eq('id', intakeId).single(),
                    supabase.from('intake_identity').select('*').eq('intake_id', intakeId).single(),
                    supabase.from('intake_sections').select('*').eq('intake_id', intakeId),
                    supabase.from('observations').select('*').eq('intake_id', intakeId)
                ]);

                const [
                    { data: baseIntake, error: baseError },
                    { data: identity, error: identityError },
                    { data: sections, error: sectionsError },
                    { data: observations, error: obsError }
                ] = results;

                if (baseError) {
                    console.error('Base Intake Error:', baseError);
                    throw baseError;
                }

                // Reconstruct legacy 'data' object for backward compatibility
                const legacyData: any = { ...(baseIntake?.data || {}) };

                // Overlay Relational Truth (Strangle Pattern)
                if (identity) {
                    legacyData.identity = {
                        ...legacyData.identity,
                        clientName: `${identity.first_name || ''} ${identity.last_name || ''}`.trim(),
                        birthDate: identity.date_of_birth,
                        ssnLastFour: identity.ssn_last_four,
                        phone: identity.phone,
                        email: identity.email,
                        address: identity.address,
                        gender: identity.gender,
                        race: identity.race
                    };
                }

                if (sections) {
                    sections.forEach((s: any) => {
                        if (s.section_name === 'identity') {
                            legacyData.identity = { ...legacyData.identity, sectionStatus: s.status };
                        } else if (s.section_name === 'medical') {
                            legacyData.medical = { ...legacyData.medical, sectionStatus: s.status };
                        }
                        // Add other mappings as needed
                    });
                }

                if (observations) {
                    legacyData.clinical_observations = observations.map((o: any) => ({
                        id: o.id,
                        category: o.domain,
                        observation: o.value,
                        source: o.source,
                        confidence: o.confidence
                    }));
                }

                setIntake({
                    ...(baseIntake as unknown as IntakeRecord),
                    data: legacyData
                });

            } catch (err: any) {
                console.error('Error fetching intake slices:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchIntakeSlices();

        // Subscriptions for relational updates
        // Subscriptions for relational updates (Robust)
        const channels: any[] = [];
        try {
            const tables = [
                { table: 'intakes', filter: `id=eq.${intakeId}` },
                { table: 'intake_identity', filter: `intake_id=eq.${intakeId}` },
                { table: 'intake_sections', filter: `intake_id=eq.${intakeId}` },
                { table: 'observations', filter: `intake_id=eq.${intakeId}` }
            ];

            tables.forEach(t => {
                const channel = supabase
                    .channel(`sub_${t.table}_${intakeId}`)
                    .on('postgres_changes',
                        { event: '*', schema: 'public', table: t.table, filter: t.filter },
                        () => {
                            // Debounce could be added here
                            fetchIntakeSlices();
                        }
                    )
                    .subscribe((status) => {
                        if (status === 'CHANNEL_ERROR') {
                            console.warn(`Realtime subscription error for ${t.table}`);
                        }
                    });
                channels.push(channel);
            });
        } catch (e) {
            console.warn('Realtime subscription failed (WebSocket unavailable?)', e);
        }

        return () => {
            channels.forEach(c => {
                if (c) supabase.removeChannel(c);
            });
        };
    }, [intakeId]);

    return { intake, loading, error: error || (loading === false && !intake ? 'Intake not found' : null) };
}
