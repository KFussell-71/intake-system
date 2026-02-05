export type Profile = {
    id: string;
    username: string;
    full_name?: string;
    email?: string;
    role: 'admin' | 'supervisor' | 'specialist' | 'intake_worker';
};

export type Client = {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    created_at: string;
    created_by: string;
};

export type Intake = {
    id: string;
    client_id: string;
    report_date: string;
    prepared_by: string;
    completion_date?: string;
    data: any;
    created_at: string;
    updated_at: string;
    updated_by?: string;
};

export type AuditLog = {
    id: string;
    user_id: string;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    entity_type: string;
    entity_id: string;
    details: any;
    created_at: string;
};
