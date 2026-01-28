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
                }
                Insert: {
                    id?: string
                    client_id?: string | null
                    report_date: string
                    prepared_by?: string | null
                    completion_date?: string | null
                    data?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string | null
                    report_date?: string
                    prepared_by?: string | null
                    completion_date?: string | null
                    data?: Json | null
                    created_at?: string
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
