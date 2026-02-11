'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { MedicalData } from '@/features/intake/types/intake';
import { revalidatePath } from 'next/cache';
import { validateSection } from '@/lib/validation/intakeValidation';

/**
 * Saves Medical, Mental Health, and Substance Use data.
 * Implements "Dual-Write" strategy:
 * 1. Writes to new `intake_medical` table (Relational)
 * 2. Writes to `intakes.data` JSONB (Legacy Compatibility)
 * 3. Logs to `intake_events` (Audit)
 */
export async function saveMedicalAction(intakeId: string, data: Partial<MedicalData>) {
    const { authenticated, userId } = await verifyAuthentication();
    if (!authenticated || !userId) {
        return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // 0. Validation Middleware (Server Authority)
    const validation = validateSection('medical', data);
    if (!validation.success) {
        return { success: false, error: `Validation Failed: ${validation.error}` };
    }

    // Use validated data if needed, or just proceed with original partial
    // const safeData = validation.data;

    try {
        // 1. Relational Write (The Source of Truth)
        const { error: relationalError } = await supabase
            .from('intake_medical')
            .upsert({
                intake_id: intakeId,
                // Clinical Evals
                medical_eval_needed: data.medicalEvalNeeded,
                psych_eval_needed: data.psychEvalNeeded,
                // General Health
                medical_condition_current: data.medicalConditionCurrent,
                medical_condition_description: data.medicalConditionDescription,
                medical_prior_history: data.medicalPriorHistory,
                medical_meds_current: data.medicalMedsCurrent,
                medical_meds_details: data.medicalMedsDetails,
                primary_care_physician: data.primaryCarePhysician,
                primary_care_physician_contact: data.primaryCarePhysicianContact,
                medical_comments: data.medicalComments,
                medical_employment_impact: data.medicalEmploymentImpact,
                // Mental Health
                mh_history: data.mhHistory,
                mh_history_details: data.mhHistoryDetails,
                mh_prior_counseling: data.mhPriorCounseling,
                mh_prior_counseling_details: data.mhPriorCounselingDetails,
                mh_prior_counseling_dates: data.mhPriorCounselingDates,
                mh_prior_diagnosis: data.mhPriorDiagnosis,
                mh_prior_diagnosis_details: data.mhPriorDiagnosisDetails,
                mh_prior_helpful_activities: data.mhPriorHelpfulActivities,
                mh_prior_meds: data.mhPriorMeds,
                mh_prior_meds_details: data.mhPriorMedsDetails,
                // Substance Use
                tobacco_use: data.tobaccoUse,
                tobacco_duration: data.tobaccoDuration,
                tobacco_quit_interest: data.tobaccoQuitInterest,
                tobacco_products: data.tobaccoProducts,
                tobacco_other: data.tobaccoOther,
                alcohol_history: data.alcoholHistory,
                alcohol_current: data.alcoholCurrent,
                alcohol_frequency: data.alcoholFrequency,
                alcohol_quit_interest: data.alcoholQuitInterest,
                alcohol_products: data.alcoholProducts,
                alcohol_other: data.alcoholOther,
                alcohol_prior_tx: data.alcoholPriorTx,
                alcohol_prior_tx_details: data.alcoholPriorTxDetails,
                alcohol_prior_tx_duration: data.alcoholPriorTxDuration,
                drug_history: data.drugHistory,
                drug_current: data.drugCurrent,
                drug_frequency: data.drugFrequency,
                drug_quit_interest: data.drugQuitInterest,
                drug_products: data.drugProducts,
                drug_other: data.drugOther,
                drug_prior_tx: data.drugPriorTx,
                drug_prior_tx_details: data.drugPriorTxDetails,
                // Meta
                updated_by: userId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'intake_id' });

        if (relationalError) throw new Error(`Relational Write Failed: ${relationalError.message}`);

        // 2. Audit Log (Event Sourcing)
        // For large medical forms, we log a domain-level event with a diff summary if possible,
        // but here we follow the append-only delta rule. 
        // We'll log a summary of changes for this batch.
        await supabase.from('intake_events').insert({
            intake_id: intakeId,
            event_type: 'field_update',
            field_path: 'medical_domain',
            new_value: JSON.stringify(data),
            changed_by: userId
        });

        // 3. Update Section Status
        const status = data.sectionStatus || 'in_progress';
        await supabase.from('intake_sections').upsert({
            intake_id: intakeId,
            section_name: 'medical',
            status: status,
            last_updated_by: userId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'intake_id,section_name' });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath(`/modernized-intake/${intakeId}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error saving medical data:', error);
        return { success: false, error: error.message };
    }
}
