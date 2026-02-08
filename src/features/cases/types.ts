export type CaseNoteType = 'general' | 'clinical' | 'incident' | 'administrative';

export interface CaseNote {
    id?: string;
    client_id: string;
    author_id: string;
    content: string;
    type: CaseNoteType;
    is_draft?: boolean;
    created_at?: string;
    updated_at?: string;
    // Helper to join with author profile
    author?: {
        username: string;
        role: string;
    }
}

export interface CreateCaseNoteParams {
    client_id: string;
    author_id: string;
    content: string;
    type: CaseNoteType;
    is_draft?: boolean;
}
