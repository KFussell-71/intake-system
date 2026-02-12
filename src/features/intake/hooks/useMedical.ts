import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveMedicalAction } from '@/app/actions/medicalActions';
import { MedicalData } from '@/features/intake/intakeTypes';

export function useMedical(intakeId: string) {
    const [data, setData] = useState<MedicalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sectionStatus, setSectionStatus] = useState<string>('not_started');

    const fetchMedical = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Relational Medical Data ONLY (Break the Monolith)
            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select(`
                    id,
                    intake_medical(*)
                `)
                .eq('id', intakeId)
                .single();

            // Handle "not found" errors gracefully - this is expected for new intakes
            if (intakeError && (intakeError as any).code !== 'PGRST116') {
                throw intakeError;
            }

            if (!intake || (intakeError as any)?.code === 'PGRST116') {
                // Initialize with empty/default state for new intakes
                console.log(`[useMedical] No intake found for ${intakeId}, initializing with defaults`);

                setData({
                    consentToRelease: false,
                    medicalEvalNeeded: false,
                    psychEvalNeeded: false,
                    medicalConditionCurrent: false,
                    medicalConditionDescription: '',
                    medicalPriorHistory: '',
                    medicalMedsCurrent: false,
                    medicalMedsDetails: '',
                    primaryCarePhysician: '',
                    primaryCarePhysicianContact: '',
                    medicalComments: '',
                    medicalEmploymentImpact: '',
                    mhHistory: false,
                    mhHistoryDetails: '',
                    mhPriorCounseling: false,
                    mhPriorCounselingDetails: '',
                    mhPriorCounselingDates: '',
                    mhPriorDiagnosis: false,
                    mhPriorDiagnosisDetails: '',
                    mhPriorHelpfulActivities: '',
                    mhPriorMeds: false,
                    mhPriorMedsDetails: '',
                    tobaccoUse: false,
                    tobaccoDuration: '',
                    tobaccoQuitInterest: '',
                    tobaccoProducts: [],
                    tobaccoOther: '',
                    alcoholHistory: false,
                    alcoholCurrent: false,
                    alcoholFrequency: '',
                    alcoholQuitInterest: '',
                    alcoholProducts: [],
                    alcoholOther: '',
                    alcoholPriorTx: false,
                    alcoholPriorTxDetails: '',
                    alcoholPriorTxDuration: '',
                    drugHistory: false,
                    drugCurrent: false,
                    drugFrequency: '',
                    drugQuitInterest: '',
                    drugProducts: [],
                    drugOther: '',
                    drugPriorTx: false,
                    drugPriorTxDetails: '',
                    substanceComments: '',
                    substanceEmploymentImpact: ''
                });
                return;
            }

            // 2. Fetch Section Status
            const { data: section } = await supabase
                .from('intake_sections')
                .select('status')
                .eq('intake_id', intakeId)
                .eq('section_name', 'medical')
                .single();

            const relational = (intake as any).intake_medical;

            setSectionStatus(section?.status || 'not_started');

            // 3. Map Data (Strictly Relational)
            // Note: If you have not run the migration script, this will be empty.
            // We assume Sprint 2 migration has occurred.
            setData({
                // Consent (handled by ConsentWorkflow)
                consentToRelease: false, // Deprecated in favor of Consent Document

                // Clinical Evals
                medicalEvalNeeded: relational?.medical_eval_needed ?? false,
                psychEvalNeeded: relational?.psych_eval_needed ?? false,

                // General Health
                medicalConditionCurrent: relational?.medical_condition_current ?? false,
                medicalConditionDescription: relational?.medical_condition_description || '',
                medicalPriorHistory: relational?.medical_prior_history || '',
                medicalMedsCurrent: relational?.medical_meds_current ?? false,
                medicalMedsDetails: relational?.medical_meds_details || '',
                primaryCarePhysician: relational?.primary_care_physician || '',
                primaryCarePhysicianContact: relational?.primary_care_physician_contact || '',
                medicalComments: relational?.medical_comments || '',
                medicalEmploymentImpact: relational?.medical_employment_impact || '',

                // Mental Health
                mhHistory: relational?.mh_history ?? false,
                mhHistoryDetails: relational?.mh_history_details || '',
                mhPriorCounseling: relational?.mh_prior_counseling ?? false,
                mhPriorCounselingDetails: relational?.mh_prior_counseling_details || '',
                mhPriorCounselingDates: relational?.mh_prior_counseling_dates || '',
                mhPriorDiagnosis: relational?.mh_prior_diagnosis ?? false,
                mhPriorDiagnosisDetails: relational?.mh_prior_diagnosis_details || '',
                mhPriorHelpfulActivities: relational?.mh_prior_helpful_activities || '',
                mhPriorMeds: relational?.mh_prior_meds ?? false,
                mhPriorMedsDetails: relational?.mh_prior_meds_details || '',

                // Substance Use
                tobaccoUse: relational?.tobacco_use ?? false,
                tobaccoDuration: relational?.tobacco_duration || '',
                tobaccoQuitInterest: relational?.tobacco_quit_interest || '',
                tobaccoProducts: relational?.tobacco_products || [],
                tobaccoOther: relational?.tobacco_other || '',

                alcoholHistory: relational?.alcohol_history ?? false,
                alcoholCurrent: relational?.alcohol_current ?? false,
                alcoholFrequency: relational?.alcohol_frequency || '',
                alcoholQuitInterest: relational?.alcohol_quit_interest || '',
                alcoholProducts: relational?.alcohol_products || [],
                alcoholOther: relational?.alcohol_other || '',
                alcoholPriorTx: relational?.alcohol_prior_tx ?? false,
                alcoholPriorTxDetails: relational?.alcohol_prior_tx_details || '',
                alcoholPriorTxDuration: relational?.alcohol_prior_tx_duration || '',

                drugHistory: relational?.drug_history ?? false,
                drugCurrent: relational?.drug_current ?? false,
                drugFrequency: relational?.drug_frequency || '',
                drugQuitInterest: relational?.drug_quit_interest || '',
                drugProducts: relational?.drug_products || [],
                drugOther: relational?.drug_other || '',
                drugPriorTx: relational?.drug_prior_tx ?? false,
                drugPriorTxDetails: relational?.drug_prior_tx_details || '',

                substanceComments: relational?.substance_comments || '',
                substanceEmploymentImpact: relational?.substance_employment_impact || ''
            });

        } catch (err: any) {
            console.error('Error fetching medical data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchMedical();
    }, [intakeId, fetchMedical]);

    const saveMedical = async (newData: Partial<MedicalData>) => {
        try {
            setSaving(true);
            const updated = { ...data, ...newData } as MedicalData;

            // Optimistic update
            setData(updated);

            const result = await saveMedicalAction(intakeId, newData);
            if (!result.success) throw new Error(result.error);

            return { success: true };
        } catch (err: any) {
            console.error('Error saving medical:', err);
            setError(err.message);
            // Revert on error? For now, we rely on refresh or user retry.
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        const result = await saveMedical({ sectionStatus: 'in_progress' } as any);
        return result;
    };

    return {
        data,
        loading,
        saving,
        error,
        sectionStatus,
        saveMedical,
        saveDraft,
        refresh: fetchMedical
    };
}
