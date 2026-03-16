export type ClinicalNotePurpose = 'initial_assessment' | 'routine_follow_up';
export type ClinicalTemplateType = 'SOAP' | 'DAP';

export interface ClinicalNote {
    id: string;
    client_id: string;
    author_id: string;
    purpose: ClinicalNotePurpose;
    template_type: ClinicalTemplateType;
    is_finalized: boolean;
    finalized_at: string | null;
    signature: string | null;
    parent_note_id: string | null;

    // SOAP
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;

    // DAP
    data_narrative?: string;
    assessment_narrative?: string;
    plan_narrative?: string;

    extra_data: Record<string, any>;
    created_at: string;
    updated_at: string;

    // Joined data
    author?: {
        first_name: string;
        last_name: string;
        username: string;
    };
}

export interface ClinicalNoteFormData {
    purpose: ClinicalNotePurpose;
    template_type: ClinicalTemplateType;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    data_narrative?: string;
    assessment_narrative?: string;
    plan_narrative?: string;
    extra_data?: Record<string, any>;
}
