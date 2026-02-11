import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveEmploymentAction } from '@/app/actions/employmentActions';
import { VocationalData } from '@/features/intake/types/intake';

export function useEmployment(intakeId: string) {
    const [data, setData] = useState<VocationalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sectionStatus, setSectionStatus] = useState<string>('not_started');

    const fetchEmployment = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Intake Data & Relational Employment Data
            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select(`
                    data,
                    intake_employment(*)
                `)
                .eq('id', intakeId)
                .single();

            if (intakeError) throw intakeError;

            // 2. Fetch Section Status
            const { data: section } = await supabase
                .from('intake_sections')
                .select('status')
                .eq('intake_id', intakeId)
                .eq('section_name', 'employment')
                .single();

            const jsonData = intake.data as any || {};
            const relational = (intake as any).intake_employment;

            setSectionStatus(section?.status || 'not_started');

            // 3. Merge Data (Priority: Relational -> JSONB)
            // Note: Arrays might be null in relational, need to fallback to empty array or JSONB

            let ispGoals = [];
            if (relational?.isp_goals) {
                // It comes back as a JSON object/array already from Supabase client usually
                ispGoals = relational.isp_goals;
            } else if (jsonData.ispGoals) {
                ispGoals = jsonData.ispGoals;
            }

            setData({
                // Goals
                employmentGoals: relational?.employment_goals || jsonData.employmentGoals || '',
                educationGoals: relational?.education_goals || jsonData.educationGoals || '',
                housingNeeds: relational?.housing_needs || jsonData.housingNeeds || '',

                // History & Skills
                educationLevel: relational?.education_level || jsonData.educationLevel || '',
                employmentType: relational?.employment_type || jsonData.employmentType || [],
                desiredJobTitles: relational?.desired_job_titles || jsonData.desiredJobTitles || '',
                targetPay: relational?.target_pay || jsonData.targetPay || '',
                workExperienceSummary: relational?.work_experience_summary || jsonData.workExperienceSummary || '',
                transferableSkills: relational?.transferable_skills || jsonData.transferableSkills || [],
                transferableSkillsOther: relational?.transferable_skills_other || jsonData.transferableSkillsOther || '',
                industryPreferences: relational?.industry_preferences || jsonData.industryPreferences || [],
                industryOther: relational?.industry_other || jsonData.industryOther || '',

                // Readiness & Barriers
                resumeComplete: relational?.resume_complete ?? jsonData.resumeComplete ?? false,
                interviewSkills: relational?.interview_skills ?? jsonData.interviewSkills ?? false,
                jobSearchAssistance: relational?.job_search_assistance ?? jsonData.jobSearchAssistance ?? false,
                transportationAssistance: relational?.transportation_assistance ?? jsonData.transportationAssistance ?? false,
                childcareAssistance: relational?.childcare_assistance ?? jsonData.childcareAssistance ?? false,
                housingAssistance: relational?.housing_assistance ?? jsonData.housingAssistance ?? false,

                // Placement
                placementDate: relational?.placement_date || jsonData.placementDate || '',
                companyName: relational?.company_name || jsonData.companyName || '',
                jobTitle: relational?.job_title || jsonData.jobTitle || '',
                wage: relational?.wage || jsonData.wage || '',
                hoursPerWeek: relational?.hours_per_week || jsonData.hoursPerWeek || '',
                supervisorName: relational?.supervisor_name || jsonData.supervisorName || '',
                supervisorPhone: relational?.supervisor_phone || jsonData.supervisorPhone || '',
                probationEnds: relational?.probation_ends || jsonData.probationEnds || '',
                benefits: relational?.benefits || jsonData.benefits || '',
                transportationType: relational?.transportation_type || jsonData.transportationType || '',
                commuteTime: relational?.commute_time || jsonData.commuteTime || '',

                // Prep
                class1Date: relational?.class1_date || jsonData.class1Date || '',
                class2Date: relational?.class2_date || jsonData.class2Date || '',
                class3Date: relational?.class3_date || jsonData.class3Date || '',
                class4Date: relational?.class4_date || jsonData.class4Date || '',
                masterAppComplete: relational?.master_app_complete ?? jsonData.masterAppComplete ?? false,

                // Job Search
                jobSearchCommitmentCount: relational?.job_search_commitment_count || jsonData.jobSearchCommitmentCount || '',
                jobSearchCommitments: relational?.job_search_commitments || jsonData.jobSearchCommitments || [],

                // ISP
                ispGoals: ispGoals
            });

        } catch (err: any) {
            console.error('Error fetching employment data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchEmployment();
    }, [intakeId, fetchEmployment]);

    const saveEmployment = async (newData: Partial<VocationalData>) => {
        try {
            setSaving(true);
            const updated = { ...data, ...newData } as VocationalData;

            // Optimistic update
            setData(updated);

            const result = await saveEmploymentAction(intakeId, newData);
            if (!result.success) throw new Error(result.error);

            return { success: true };
        } catch (err: any) {
            console.error('Error saving employment:', err);
            setError(err.message);
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
        saveEmployment,
        refresh: fetchEmployment
    };
}
