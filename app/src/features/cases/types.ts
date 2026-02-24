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
    },
    // AI Fields
    sentiment_score?: number;
    sentiment_label?: 'positive' | 'neutral' | 'negative';
    detected_barriers?: string[];
}

export interface CreateCaseNoteParams {
    client_id: string;
    author_id: string;
    content: string;
    type: CaseNoteType;
    is_draft?: boolean;
    sentiment_score?: number;
    sentiment_label?: 'positive' | 'neutral' | 'negative';
    detected_barriers?: string[];
}

