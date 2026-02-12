'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { VocationalData } from '@/features/intake/intakeTypes';
import { revalidatePath } from 'next/cache';
import { validateSection } from '@/lib/validation/intakeValidation';

/**
 * Saves Employment, Education, and Vocational Goal data.
 * Implements "Dual-Write" strategy.
 */
export async function saveEmploymentAction(intakeId: string, data: Partial<VocationalData>) {
    const { authenticated, userId } = await verifyAuthentication();
    if (!authenticated || !userId) {
        return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // 0. Validation Middleware (Server Authority)
    const validation = validateSection('employment', data);
    if (!validation.success) {
        return { success: false, error: `Validation Failed: ${validation.error}` };
    }

    try {
        // 1. Relational Write (The Source of Truth)
        const { error: relationalError } = await supabase
            .from('intake_employment')
            .upsert({
                intake_id: intakeId,
                // Goals
                employment_goals: data.employmentGoals,
                education_goals: data.educationGoals,
                housing_needs: data.housingNeeds,
                // History & Skills
                education_level: data.educationLevel,
                employment_type: data.employmentType,
                desired_job_titles: data.desiredJobTitles,
                target_pay: data.targetPay,
                work_experience_summary: data.workExperienceSummary,
                transferable_skills: data.transferableSkills,
                transferable_skills_other: data.transferableSkillsOther,
                industry_preferences: data.industryPreferences,
                industry_other: data.industryOther,
                // Readiness & Barriers
                resume_complete: data.resumeComplete,
                interview_skills: data.interviewSkills,
                job_search_assistance: data.jobSearchAssistance,
                transportation_assistance: data.transportationAssistance,
                childcare_assistance: data.childcareAssistance,
                housing_assistance: data.housingAssistance,
                // Placement
                placement_date: data.placementDate || null,
                company_name: data.companyName,
                job_title: data.jobTitle,
                wage: data.wage,
                hours_per_week: data.hoursPerWeek,
                supervisor_name: data.supervisorName,
                supervisor_phone: data.supervisorPhone,
                probation_ends: data.probationEnds || null,
                benefits: data.benefits,
                transportation_type: data.transportationType,
                commute_time: data.commuteTime,
                // Prep
                class1_date: data.class1Date || null,
                class2_date: data.class2Date || null,
                class3_date: data.class3Date || null,
                class4_date: data.class4Date || null,
                master_app_complete: data.masterAppComplete,
                // Job Search
                job_search_commitment_count: data.jobSearchCommitmentCount,
                job_search_commitments: data.jobSearchCommitments,
                // ISP
                isp_goals: data.ispGoals ? JSON.stringify(data.ispGoals) : null,
                // Meta
                updated_by: userId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'intake_id' });

        if (relationalError) throw new Error(`Relational Write Failed: ${relationalError.message}`);

        // 2. Audit Log (Event Sourcing)
        await supabase.from('intake_events').insert({
            intake_id: intakeId,
            event_type: 'field_update',
            field_path: 'employment_domain',
            new_value: JSON.stringify(data),
            changed_by: userId
        });

        // 3. Update Section Status
        const status = data.sectionStatus || 'in_progress';
        await supabase.from('intake_sections').upsert({
            intake_id: intakeId,
            section_name: 'employment',
            status: status,
            last_updated_by: userId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'intake_id,section_name' });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath(`/modernized-intake/${intakeId}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error saving employment data:', error);
        return { success: false, error: error.message };
    }
}
