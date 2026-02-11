'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveEmploymentAction } from '@/app/actions/employmentActions';
import { VocationalData } from '@/features/intake/types/intake';

export function useVocational(intakeId: string) {
    const [data, setData] = useState<VocationalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sectionStatus, setSectionStatus] = useState<string>('not_started');

    const fetchVocational = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Relational Employment Data
            const { data: intake, error: intakeError } = await supabase
                .from('intakes')
                .select(`
                    id,
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

            const relational = (intake as any).intake_employment;

            setSectionStatus(section?.status || 'not_started');

            // 3. Map Data (Strictly Relational)
            setData({
                // Goals
                employmentGoals: relational?.employment_goals || '',
                educationGoals: relational?.education_goals || '',
                housingNeeds: relational?.housing_needs || '',

                // History
                educationLevel: relational?.education_level || '',
                employmentType: relational?.employment_type || [],
                desiredJobTitles: relational?.desired_job_titles || '',
                targetPay: relational?.target_pay || '',
                workExperienceSummary: relational?.work_experience_summary || '',
                transferableSkills: relational?.transferable_skills || [],
                transferableSkillsOther: relational?.transferable_skills_other || '',
                industryPreferences: relational?.industry_preferences || [],
                industryOther: relational?.industry_other || '',

                // Readiness
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
                transportationType: (relational?.transportation_type as any) || '',
                commuteTime: relational?.commute_time || '',

                // Curriculum
                class1Date: relational?.class_1_date || '',
                class2Date: relational?.class_2_date || '',
                class3Date: relational?.class_3_date || '',
                class4Date: relational?.class_4_date || '',
                masterAppComplete: relational?.master_app_complete ?? false,
                jobSearchCommitmentCount: relational?.job_search_commitment_count || '',
                jobSearchCommitments: relational?.job_search_commitments || [],
                ispGoals: relational?.isp_goals || []
            });

        } catch (err: any) {
            console.error('Error fetching vocational data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [intakeId]);

    useEffect(() => {
        if (intakeId) fetchVocational();
    }, [intakeId, fetchVocational]);

    const saveVocational = async (newData: Partial<VocationalData>) => {
        try {
            setSaving(true);
            const updated = { ...data, ...newData } as VocationalData;

            // Optimistic update
            setData(updated);

            const result = await saveEmploymentAction(intakeId, newData);
            if (!result.success) throw new Error(result.error);

            return { success: true };
        } catch (err: any) {
            console.error('Error saving vocational:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = async () => {
        return await saveVocational({ sectionStatus: 'in_progress' } as any);
    };

    return {
        data,
        loading,
        saving,
        error,
        sectionStatus,
        saveVocational,
        saveDraft,
        refresh: fetchVocational
    };
}
