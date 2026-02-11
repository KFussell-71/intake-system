import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveMedicalAction } from '@/app/actions/medicalActions';
import { MedicalData } from '@/features/intake/types/intake';

export function useMedical(intakeId: string) {
    const [data, setData] = useState<MedicalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sectionStatus, setSectionStatus] = useState<string>('not_started');

    const fetchMedical = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Intake Data & Relational Medical Data
            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select(`
                    data,
                    intake_medical(*)
                `)
                .eq('id', intakeId)
                .single();

            if (intakeError) throw intakeError;

            // 2. Fetch Section Status
            const { data: section } = await supabase
                .from('intake_sections')
                .select('status')
                .eq('intake_id', intakeId)
                .eq('section_name', 'medical')
                .single();

            const jsonData = intake.data as any || {};
            const relational = (intake as any).intake_medical;

            setSectionStatus(section?.status || 'not_started');

            // 3. Merge Data (Priority: Relational -> JSONB)
            setData({
                // Consent (Still legacy or handled by ConsentWorkflow, but part of type)
                consentToRelease: jsonData.consentToRelease || false,

                // Clinical Evals
                medicalEvalNeeded: relational?.medical_eval_needed ?? jsonData.medicalEvalNeeded ?? false,
                psychEvalNeeded: relational?.psych_eval_needed ?? jsonData.psychEvalNeeded ?? false,

                // General Health
                medicalConditionCurrent: relational?.medical_condition_current ?? jsonData.medicalConditionCurrent ?? false,
                medicalConditionDescription: relational?.medical_condition_description || jsonData.medicalConditionDescription || '',
                medicalPriorHistory: relational?.medical_prior_history || jsonData.medicalPriorHistory || '',
                medicalMedsCurrent: relational?.medical_meds_current ?? jsonData.medicalMedsCurrent ?? false,
                medicalMedsDetails: relational?.medical_meds_details || jsonData.medicalMedsDetails || '',
                primaryCarePhysician: relational?.primary_care_physician || jsonData.primaryCarePhysician || '',
                primaryCarePhysicianContact: relational?.primary_care_physician_contact || jsonData.primaryCarePhysicianContact || '',
                medicalComments: relational?.medical_comments || jsonData.medicalComments || '',
                medicalEmploymentImpact: relational?.medical_employment_impact || jsonData.medicalEmploymentImpact || '',

                // Mental Health
                mhHistory: relational?.mh_history ?? jsonData.mhHistory ?? false,
                mhHistoryDetails: relational?.mh_history_details || jsonData.mhHistoryDetails || '',
                mhPriorCounseling: relational?.mh_prior_counseling ?? jsonData.mhPriorCounseling ?? false,
                mhPriorCounselingDetails: relational?.mh_prior_counseling_details || jsonData.mhPriorCounselingDetails || '',
                mhPriorCounselingDates: relational?.mh_prior_counseling_dates || jsonData.mhPriorCounselingDates || '',
                mhPriorDiagnosis: relational?.mh_prior_diagnosis ?? jsonData.mhPriorDiagnosis ?? false,
                mhPriorDiagnosisDetails: relational?.mh_prior_diagnosis_details || jsonData.mhPriorDiagnosisDetails || '',
                mhPriorHelpfulActivities: relational?.mh_prior_helpful_activities || jsonData.mhPriorHelpfulActivities || '',
                mhPriorMeds: relational?.mh_prior_meds ?? jsonData.mhPriorMeds ?? false,
                mhPriorMedsDetails: relational?.mh_prior_meds_details || jsonData.mhPriorMedsDetails || '',

                // Substance Use
                tobaccoUse: relational?.tobacco_use ?? jsonData.tobaccoUse ?? false,
                tobaccoDuration: relational?.tobacco_duration || jsonData.tobaccoDuration || '',
                tobaccoQuitInterest: relational?.tobacco_quit_interest || jsonData.tobaccoQuitInterest || '',
                tobaccoProducts: relational?.tobacco_products || jsonData.tobaccoProducts || [],
                tobaccoOther: relational?.tobacco_other || jsonData.tobaccoOther || '',

                alcoholHistory: relational?.alcohol_history ?? jsonData.alcoholHistory ?? false,
                alcoholCurrent: relational?.alcohol_current ?? jsonData.alcoholCurrent ?? false,
                alcoholFrequency: relational?.alcohol_frequency || jsonData.alcoholFrequency || '',
                alcoholQuitInterest: relational?.alcohol_quit_interest || jsonData.alcoholQuitInterest || '',
                alcoholProducts: relational?.alcohol_products || jsonData.alcoholProducts || [],
                alcoholOther: relational?.alcohol_other || jsonData.alcoholOther || '',
                alcoholPriorTx: relational?.alcohol_prior_tx ?? jsonData.alcoholPriorTx ?? false,
                alcoholPriorTxDetails: relational?.alcohol_prior_tx_details || jsonData.alcoholPriorTxDetails || '',
                alcoholPriorTxDuration: relational?.alcohol_prior_tx_duration || jsonData.alcoholPriorTxDuration || '',

                drugHistory: relational?.drug_history ?? jsonData.drugHistory ?? false,
                drugCurrent: relational?.drug_current ?? jsonData.drugCurrent ?? false,
                drugFrequency: relational?.drug_frequency || jsonData.drugFrequency || '',
                drugQuitInterest: relational?.drug_quit_interest || jsonData.drugQuitInterest || '',
                drugProducts: relational?.drug_products || jsonData.drugProducts || [],
                drugOther: relational?.drug_other || jsonData.drugOther || '',
                drugPriorTx: relational?.drug_prior_tx ?? jsonData.drugPriorTx ?? false,
                drugPriorTxDetails: relational?.drug_prior_tx_details || jsonData.drugPriorTxDetails || '',

                substanceComments: relational?.substance_comments || jsonData.substanceComments || '',
                substanceEmploymentImpact: relational?.substance_employment_impact || jsonData.substanceEmploymentImpact || ''
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

    return {
        data,
        loading,
        saving,
        error,
        sectionStatus,
        saveMedical,
        refresh: fetchMedical
    };
}
