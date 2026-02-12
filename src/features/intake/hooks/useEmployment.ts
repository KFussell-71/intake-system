import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveEmploymentAction } from '@/app/actions/employmentActions';
import { VocationalData } from '@/features/intake/intakeTypes';

export function useEmployment(intakeId: string) {
    const [data, setData] = useState<VocationalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sectionStatus, setSectionStatus] = useState<string>('not_started');

    const fetchEmployment = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Relational Employment Data ONLY (Break the Monolith)
            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select(`
                    id,
                    intake_employment(*)
                `)
                .eq('id', intakeId)
                .single();

            // Handle "not found" errors gracefully - this is expected for new intakes
            if (intakeError && (intakeError as any).code !== 'PGRST116') {
                throw intakeError;
            }

            if (!intake || (intakeError as any)?.code === 'PGRST116') {
                // Initialize with empty/default state for new intakes
                console.log(`[useEmployment] No intake found for ${intakeId}, initializing with defaults`);

                setData({
                    employmentGoals: '',
                    educationGoals: '',
                    housingNeeds: '',
                    educationLevel: '',
                    employmentType: [],
                    desiredJobTitles: '',
                    targetPay: '',
                    workExperienceSummary: '',
                    transferableSkills: [],
                    transferableSkillsOther: '',
                    industryPreferences: [],
                    industryOther: '',
                    resumeComplete: false,
                    interviewSkills: false,
                    jobSearchAssistance: false,
                    transportationAssistance: false,
                    childcareAssistance: false,
                    housingAssistance: false,
                    placementDate: '',
                    companyName: '',
                    jobTitle: '',
                    wage: '',
                    hoursPerWeek: '',
                    supervisorName: '',
                    supervisorPhone: '',
                    probationEnds: '',
                    benefits: '',
                    transportationType: '',
                    commuteTime: '',
                    class1Date: '',
                    class2Date: '',
                    class3Date: '',
                    class4Date: '',
                    masterAppComplete: false,
                    jobSearchCommitmentCount: '',
                    jobSearchCommitments: [],
                    ispGoals: []
                });
                return;
            }

            // 2. Fetch Section Status
            const { data: section } = await supabase
                .from('intake_sections')
                .select('status')
                .eq('intake_id', intakeId)
                .eq('section_name', 'employment')
                .single();

            const relational = (intake as any).intake_employment;

            setSectionStatus(section?.status || 'not_started');

            // 3. Map Data (Strictly Relational)
            // Note: Arrays might be null in relational, need to fallback to empty array or JSONB

            let ispGoals = [];
            if (relational?.isp_goals) {
                // It comes back as a JSON object/array already from Supabase client usually
                ispGoals = relational.isp_goals;
            }

            setData({
                // Goals
                employmentGoals: relational?.employment_goals || '',
                educationGoals: relational?.education_goals || '',
                housingNeeds: relational?.housing_needs || '',

                // History & Skills
                educationLevel: relational?.education_level || '',
                employmentType: relational?.employment_type || [],
                desiredJobTitles: relational?.desired_job_titles || '',
                targetPay: relational?.target_pay || '',
                workExperienceSummary: relational?.work_experience_summary || '',
                transferableSkills: relational?.transferable_skills || [],
                transferableSkillsOther: relational?.transferable_skills_other || '',
                industryPreferences: relational?.industry_preferences || [],
                industryOther: relational?.industry_other || '',

                // Readiness & Barriers
                resumeComplete: relational?.resume_complete ?? false,
                interviewSkills: relational?.interview_skills ?? false,
                jobSearchAssistance: relational?.job_search_assistance ?? false,
                transportationAssistance: relational?.transportation_assistance ?? false,
                childcareAssistance: relational?.childcare_assistance ?? false,
                housingAssistance: relational?.housing_assistance ?? false,

                // Placement
                placementDate: relational?.placement_date || '',
                companyName: relational?.company_name || '',
                jobTitle: relational?.job_title || '',
                wage: relational?.wage || '',
                hoursPerWeek: relational?.hours_per_week || '',
                supervisorName: relational?.supervisor_name || '',
                supervisorPhone: relational?.supervisor_phone || '',
                probationEnds: relational?.probation_ends || '',
                benefits: relational?.benefits || '',
                transportationType: relational?.transportation_type || '', // 'bus' | 'car' | 'other' | ''
                commuteTime: relational?.commute_time || '',

                // Prep
                class1Date: relational?.class1_date || '',
                class2Date: relational?.class2_date || '',
                class3Date: relational?.class3_date || '',
                class4Date: relational?.class4_date || '',
                masterAppComplete: relational?.master_app_complete ?? false,

                // Job Search
                jobSearchCommitmentCount: relational?.job_search_commitment_count || '',
                jobSearchCommitments: relational?.job_search_commitments || [],

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

    const saveDraft = async () => {
        const result = await saveEmployment({ sectionStatus: 'in_progress' } as any);
        return result;
    };

    return {
        data,
        loading,
        saving,
        error,
        sectionStatus,
        saveEmployment,
        saveDraft,
        refresh: fetchEmployment
    };
}
