export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            clients: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    email: string | null
                    address: string | null
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    created_at?: string
                    created_by?: string | null
                }
            }
            intakes: {
                Row: {
                    id: string
                    client_id: string | null
                    report_date: string
                    prepared_by: string | null
                    completion_date: string | null
                    data: Json | null
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    client_id?: string | null
                    report_date: string
                    prepared_by?: string | null
                    completion_date?: string | null
                    data?: Json | null
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    client_id?: string | null
                    report_date?: string
                    prepared_by?: string | null
                    completion_date?: string | null
                    data?: Json | null
                    created_at?: string
                    created_by?: string | null
                }
            }
            documents: {
                Row: {
                    id: string
                    client_id: string
                    name: string
                    url: string
                    type: string
                    size: number | null
                    uploaded_at: string
                    uploaded_by: string | null
                }
                Insert: {
                    id?: string
                    client_id: string
                    name: string
                    url: string
                    type: string
                    size?: number | null
                    uploaded_at?: string
                    uploaded_by?: string | null
                }
                Update: {
                    id?: string
                    client_id?: string
                    name?: string
                    url?: string
                    type?: string
                    size?: number | null
                    uploaded_at?: string
                    uploaded_by?: string | null
                }
            }
            intake_sections: {
                Row: {
                    id: string
                    intake_id: string
                    section_name: string
                    status: 'not_started' | 'in_progress' | 'complete' | 'waived'
                    last_updated_by: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    intake_id: string
                    section_name: string
                    status: 'not_started' | 'in_progress' | 'complete' | 'waived'
                    last_updated_by?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    intake_id?: string
                    section_name?: string
                    status?: 'not_started' | 'in_progress' | 'complete' | 'waived'
                    last_updated_by?: string | null
                    updated_at?: string
                }
            }
            observations: {
                Row: {
                    id: string
                    intake_id: string
                    domain: string
                    value: string
                    source: 'client' | 'counselor' | 'document'
                    confidence: string | null
                    author_user_id: string | null
                    observed_at: string
                }
                Insert: {
                    id?: string
                    intake_id: string
                    domain: string
                    value: string
                    source: 'client' | 'counselor' | 'document'
                    confidence?: string | null
                    author_user_id?: string | null
                    observed_at?: string
                }
                Update: {
                    id?: string
                    intake_id?: string
                    domain?: string
                    value?: string
                    source?: 'client' | 'counselor' | 'document'
                    confidence?: string | null
                    author_user_id?: string | null
                    observed_at?: string
                }
            }
            barriers: {
                Row: {
                    id: number
                    key: string
                    display: string
                    category: string | null
                    active: boolean
                }
                Insert: {
                    id?: number
                    key: string
                    display: string
                    category?: string | null
                    active?: boolean
                }
                Update: {
                    id?: number
                    key?: string
                    display?: string
                    category?: string | null
                    active?: boolean
                }
            }
            intake_barriers: {
                Row: {
                    intake_id: string
                    barrier_id: number
                    source: string | null
                    added_at: string
                    notes: string | null
                }
                Insert: {
                    intake_id: string
                    barrier_id: number
                    source?: string | null
                    added_at?: string
                    notes?: string | null
                }
                Update: {
                    intake_id?: string
                    barrier_id?: number
                    source?: string | null
                    added_at?: string
                    notes?: string | null
                }
            }
            consent_documents: {
                Row: {
                    id: string
                    intake_id: string | null
                    template_version: string
                    scope_text: string
                    expires_at: string | null
                    created_at: string
                    created_by: string | null
                    locked: boolean
                }
                Insert: {
                    id?: string
                    intake_id?: string | null
                    template_version: string
                    scope_text: string
                    expires_at?: string | null
                    created_at?: string
                    created_by?: string | null
                    locked?: boolean
                }
                Update: {
                    id?: string
                    intake_id?: string | null
                    template_version?: string
                    scope_text?: string
                    expires_at?: string | null
                    created_at?: string
                    created_by?: string | null
                    locked?: boolean
                }
            }
            consent_signatures: {
                Row: {
                    id: string
                    consent_document_id: string | null
                    signer_name: string
                    signer_role: string
                    method: string
                    signed_at: string
                    document_hash: string | null
                    ip_address: string | null
                }
                Insert: {
                    id?: string
                    consent_document_id?: string | null
                    signer_name: string
                    signer_role: string
                    method: string
                    signed_at?: string
                    document_hash?: string | null
                    ip_address?: string | null
                }
                Update: {
                    id?: string
                    consent_document_id?: string | null
                    signer_name?: string
                    signer_role?: string
                    method?: string
                    signed_at?: string
                    document_hash?: string | null
                    ip_address?: string | null
                }
            }
            intake_events: {
                Row: {
                    id: string
                    intake_id: string | null
                    event_type: string
                    field_path: string | null
                    old_value: string | null
                    new_value: string | null
                    changed_by: string | null
                    changed_at: string
                }
                Insert: {
                    id?: string
                    intake_id?: string | null
                    event_type: string
                    field_path?: string | null
                    old_value?: string | null
                    new_value?: string | null
                    changed_by?: string | null
                    changed_at?: string
                }
                Update: {
                    id?: string
                    intake_id?: string | null
                    event_type?: string
                    field_path?: string | null
                    old_value?: string | null
                    new_value?: string | null
                    changed_by?: string | null
                    changed_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            create_client_intake: {
                Args: {
                    p_name: string
                    p_phone: string
                    p_email: string
                    p_address: string
                    p_report_date: string
                    p_completion_date: string
                    p_intake_data: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
