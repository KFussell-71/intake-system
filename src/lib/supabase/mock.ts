import { SupabaseClient } from '@supabase/supabase-js';

// Mock Data
const MOCK_USER = {
    id: 'mock-user-id',
    email: 'testuser@example.com',
    role: 'authenticated'
};

const MOCK_BUNDLE = {
    client: {
        id: 'mock-client-id',
        name: 'Kyla Stevenson',
        first_name: 'Kyla',
        last_name: 'Stevenson',
        phone: '555-0199',
        email: 'kyla.s@example.com'
    },
    intake: {
        id: 'mock-intake-id',
        report_date: new Date().toISOString(),
        status: 'In Progress',
        details: {
            workExperienceSummary: 'Kyla has multiple skills as a care giver, behavioral therapist, data entry operator, call center front desk clerk, customer service.',
            ispGoals: 'Kyla will take part in the Intake, Job Preparation Classes, and Job Search and have access to the NBO Job Developer.',
            barriers: ['Chronic illnesses affecting attendance', 'Limited local AV job options'],
            desiredJobTitles: 'Producer, Project Coordinator, Photographer',
            industryPreference: 'Non-profit, Television, Media',
            targetPayRange: '20.00',
            strengths: 'Attention to detail, quick learner',
            motivation: 'Her child',
            readinessScale: '10',
            preferredContactMethods: { email: true, text: true, phone: true }
        }
    },
    documents: [
        { id: 'd1', name: 'Referral Form', type: 'referral', status: 'Reviewed' },
        { id: 'd2', name: 'IPE Authorization', type: 'ipe', status: 'Reviewed' }
    ],
    employment_history: [
        { id: 'e1', job_title: 'Care Giver', employer: 'Home Health', notes: 'Patient care focus' }
    ],
    isp_goals: [
        { id: 'g1', goal_type: 'Obtain Employment', target_date: '2026-03-01', status: 'Active' }
    ],
    supportive_services: [
        { id: 's1', service_type: 'Transportation', description: 'Gas assistance', status: 'Requested' }
    ],
    follow_up: { next_meeting_date: '2026-02-02' }
};

// Mock Worker Profiles
const MOCK_WORKERS = [
    { id: 'worker-1', username: 'James Jones', email: 'james.jones@nbo.org', role: 'staff' },
    { id: 'worker-2', username: 'Sarah Smith', email: 'sarah.smith@nbo.org', role: 'staff' },
    { id: 'worker-3', username: 'Mike Johnson', email: 'mike.johnson@nbo.org', role: 'staff' },
    { id: 'worker-4', username: 'Lisa Chen', email: 'lisa.chen@nbo.org', role: 'staff' }
];

// Mock Client Assignments
const MOCK_ASSIGNMENTS = [
    {
        id: 'assign-1',
        client_id: 'mock-client-id',
        assigned_worker_id: 'worker-1',
        assigned_by: 'mock-user-id',
        assigned_date: '2026-01-15T10:00:00Z',
        assignment_type: 'primary',
        notes: 'Initial assignment based on caseload balance',
        active: true,
        created_at: '2026-01-15T10:00:00Z'
    },
    {
        id: 'assign-2',
        client_id: 'client-2',
        assigned_worker_id: 'worker-2',
        assigned_by: 'mock-user-id',
        assigned_date: '2026-01-20T14:30:00Z',
        assignment_type: 'primary',
        notes: 'Specialist in media industry placements',
        active: true,
        created_at: '2026-01-20T14:30:00Z'
    }
];

// Mock Supervisor Actions
// Search Mock Data
const MOCK_DOCUMENTS = [
    { id: 'doc-1', client_id: 'client-1', name: 'Resume_JohnDoe.pdf', description: 'Updated resume for hospitality roles', file_url: '/mock/resume.pdf', created_at: '2026-02-01T10:00:00Z' },
    { id: 'doc-2', client_id: 'client-1', name: 'ID_Card.jpg', description: 'State ID Scan', file_url: '/mock/id.jpg', created_at: '2026-01-20T14:30:00Z' },
    { id: 'doc-3', client_id: 'client-2', name: 'ISP_Goal_Sheet.pdf', description: 'Signed goal agreement', file_url: '/mock/isp.pdf', created_at: '2026-01-15T09:00:00Z' }
];

// Analytics Mocks
const MOCK_INTAKE_TRENDS = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
        date: d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5)
    };
});

const MOCK_STAFF_WORKLOAD = [
    { staff_name: 'Sarah Smith', active_clients: 12, intakes_in_progress: 3 },
    { staff_name: 'Mike Johnson', active_clients: 8, intakes_in_progress: 5 },
    { staff_name: 'David Wilson', active_clients: 15, intakes_in_progress: 1 },
];

const MOCK_RECENT_ACTIVITY = [
    { id: 'act-1', event_type: 'intake', description: 'New intake started', created_at: new Date().toISOString(), client_name: 'John Doe' },
    { id: 'act-2', event_type: 'document', description: 'Document uploaded: Resume.pdf', created_at: new Date(Date.now() - 3600000).toISOString(), client_name: 'Jane Smith' },
    { id: 'act-3', event_type: 'follow_up', description: 'Follow-up: Phone Call', created_at: new Date(Date.now() - 7200000).toISOString(), client_name: 'Bob Jones' },
];

const MOCK_ACTIONS = [
    {
        id: 'action-1',
        supervisor_id: 'mock-user-id',
        action_type: 'approve',
        target_id: 'intake-1',
        target_type: 'intake',
        notes: 'Report meets DOR standards',
        metadata: { clientName: 'Kyla Stevenson' },
        created_at: '2026-02-01T09:15:00Z'
    },
    {
        id: 'action-2',
        supervisor_id: 'mock-user-id',
        action_type: 'assign',
        target_id: 'mock-client-id',
        target_type: 'client',
        notes: 'Assigned to James Jones',
        metadata: { workerId: 'worker-1', workerName: 'James Jones' },
        created_at: '2026-01-15T10:00:00Z'
    },
    {
        id: 'action-3',
        supervisor_id: 'mock-user-id',
        action_type: 'return',
        target_id: 'intake-2',
        target_type: 'intake',
        notes: 'Missing employment history details',
        metadata: { reason: 'Missing information', urgent: true },
        created_at: '2026-02-01T14:30:00Z'
    },
    {
        id: 'action-4',
        supervisor_id: 'mock-user-id',
        action_type: 'bulk_approve',
        target_id: null,
        target_type: 'intake',
        notes: 'Bulk approval of 5 reports',
        metadata: { count: 5, intakeIds: ['intake-3', 'intake-4', 'intake-5', 'intake-6', 'intake-7'] },
        created_at: '2026-02-01T16:00:00Z'
    }
];

// Mock Intakes with various statuses
const MOCK_INTAKES = [
    {
        id: 'intake-awaiting-1',
        client_id: 'mock-client-id',
        status: 'awaiting_review',
        created_at: '2026-02-01T08:00:00Z',
        clients: { name: 'Kyla Stevenson' },
        profiles: { username: 'James Jones' }
    },
    {
        id: 'intake-awaiting-2',
        client_id: 'client-2',
        status: 'awaiting_review',
        created_at: '2026-02-01T10:30:00Z',
        clients: { name: 'John Martinez' },
        profiles: { username: 'Sarah Smith' }
    },
    {
        id: 'intake-revision-1',
        client_id: 'client-3',
        status: 'needs_revision',
        revision_notes: 'Please add more details about employment goals',
        returned_at: '2026-02-01T14:00:00Z',
        returned_by: 'mock-user-id',
        created_at: '2026-01-31T09:00:00Z',
        clients: { name: 'Maria Garcia' },
        profiles: { username: 'Mike Johnson' }
    }
];


// Mock Implementation
export const createMockSupabase = () => {
    console.warn('[MOCK] Creating Mock Supabase Client');

    return {
        auth: {
            getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
            signInWithPassword: async () => {
                // Simulate cookie setting for middleware detection (if simple check)
                if (typeof document !== 'undefined') {
                    document.cookie = "sb-access-token=mock-token; path=/";
                }
                return {
                    data: {
                        user: MOCK_USER,
                        session: {
                            access_token: 'mock-token',
                            refresh_token: 'mock-refresh',
                            user: MOCK_USER,
                            expires_in: 3600,
                            token_type: 'bearer'
                        }
                    },
                    error: null
                };
            },
            signOut: async () => {
                if (typeof document !== 'undefined') {
                    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
                return { error: null };
            },
            getSession: async () => ({
                data: {
                    session: {
                        access_token: 'mock-token',
                        refresh_token: 'mock-refresh',
                        user: MOCK_USER,
                        expires_in: 3600,
                        token_type: 'bearer'
                    }
                },
                error: null
            }),
        },
        from: (table: string) => {
            const queryBuilder: any = {
                select: (cols?: string, options?: any) => {
                    // Support count queries
                    if (options?.count === 'exact' && options?.head) {
                        queryBuilder._isCountQuery = true;
                    }
                    return queryBuilder;
                },
                eq: (col: string, val: any) => queryBuilder,
                gt: (col: string, val: any) => queryBuilder,
                gte: (col: string, val: any) => queryBuilder,
                lt: (col: string, val: any) => queryBuilder,
                lte: (col: string, val: any) => queryBuilder,
                neq: (col: string, val: any) => queryBuilder,
                // FORENSIC FIX: Add .not() method required by DashboardRepository.ts:13
                not: (col: string, operator: string, val: any) => {
                    console.warn(`[MOCK] .not('${col}', '${operator}', ${val}) - filter ignored in mock`);
                    return queryBuilder;
                },
                or: (query: string) => {
                    console.warn(`[MOCK] .or('${query}') - filter ignored in mock`);
                    return queryBuilder;
                },
                match: (query: Record<string, any>) => {
                    console.warn(`[MOCK] .match() - filter ignored in mock`);
                    return queryBuilder;
                },
                order: (col: string, options?: any) => queryBuilder,
                range: (from: number, to: number) => queryBuilder,
                limit: (n: number) => queryBuilder,
                single: async () => {
                    if (table === 'profiles') return { data: { role: 'staff' }, error: null };
                    if (table === 'report_versions') return { data: null, error: null };
                    if (table === 'clients') return { data: MOCK_BUNDLE.client, error: null };
                    return { data: {}, error: null };
                },
                maybeSingle: async () => {
                    if (table === 'profiles') return { data: { role: 'staff' }, error: null };
                    return { data: null, error: null };
                },
                // Support count queries for dashboard stats
                then: async (resolve: Function) => {
                    if (queryBuilder._isCountQuery) {
                        // Return mock count data
                        const mockCounts: Record<string, number> = {
                            'clients': 12,
                            'intakes': 8,
                            'documents': 24,
                            'job_placements': 5,
                            'client_assignments': MOCK_ASSIGNMENTS.length,
                            'supervisor_actions': MOCK_ACTIONS.length
                        };
                        resolve({ count: mockCounts[table] || 0, data: null, error: null });
                    } else {
                        // Return mock data based on table
                        if (table === 'intakes') {
                            resolve({ data: MOCK_INTAKES, error: null });
                        } else if (table === 'profiles') {
                            resolve({ data: MOCK_WORKERS, error: null });
                        } else if (table === 'client_assignments') {
                            resolve({ data: MOCK_ASSIGNMENTS, error: null });
                        } else if (table === 'supervisor_actions') {
                            resolve({ data: MOCK_ACTIONS, error: null });
                        } else {
                            resolve({ data: [], error: null });
                        }
                    }
                },
                insert: async (data: any) => {
                    console.warn(`[MOCK] Inserting into ${table}:`, data);
                    // Generate mock ID
                    const mockId = `mock-${table}-${Date.now()}`;
                    return { error: null, data: { ...data, id: mockId } };
                },
                update: async (data: any) => {
                    console.warn(`[MOCK] Updating ${table}:`, data);
                    const updateResult = {
                        eq: (col: string, val: any) => ({
                            select: () => ({
                                single: async () => ({ data: { ...data }, error: null })
                            })
                        })
                    };
                    // Return result that can be awaited or chained
                    return Promise.resolve(updateResult) as any;
                },
                in: (col: string, values: any[]) => {
                    console.warn(`[MOCK] .in('${col}', [${values.length} items]) - filter applied`);
                    queryBuilder._inFilter = { col, values };
                    return queryBuilder;
                },
                upload: async () => ({ data: { path: 'mock-path' }, error: null }),
                createSignedUrl: async () => ({ data: { signedUrl: 'http://localhost:3000/mock.pdf' }, error: null })
            };
            return queryBuilder;
        },
        rpc: async (fn: string, args: any) => {
            console.warn(`[MOCK] Calling RPC: ${fn}`, args);
            if (fn === 'get_client_intake_bundle') return { data: MOCK_BUNDLE, error: null };
            if (fn === 'create_client_intake') return { data: { client_id: 'mock-uuid-1234' }, error: null };
            return { data: null, error: null };
        },
        storage: {
            from: (bucket: string) => ({
                upload: async (path: string, file: File) => {
                    console.log(`[MOCK] Uploading file to ${bucket}/${path}`, file.name);
                    return { data: { path: path }, error: null };
                },
                createSignedUrl: async (path: string) => ({
                    data: { signedUrl: `https://placehold.co/600x400/png?text=Preview+${path}` },
                    error: null
                }),
                getPublicUrl: (path: string) => ({
                    data: { publicUrl: `https://placehold.co/600x400/png?text=Public+${path}` }
                }),
                download: async (path: string) => {
                    console.log(`[MOCK] Downloading ${path}`);
                    // Return a fake blob
                    const blob = new Blob(["Mock PDF Content"], { type: 'application/pdf' });
                    return { data: blob, error: null };
                }
            })
        },
        // Realtime subscription methods (required by NotificationCenter)
        channel: (name: string) => {
            console.warn(`[MOCK] Creating realtime channel '${name}' - no events will fire`);
            return {
                on: (event: string, config: any, callback: Function) => ({
                    subscribe: () => {
                        console.warn(`[MOCK] Subscribed to '${event}' on channel '${name}' - mock subscription active`);
                        return {
                            unsubscribe: () => {
                                console.warn(`[MOCK] Unsubscribed from channel '${name}'`);
                            }
                        };
                    }
                })
            };
        },
        removeChannel: (channel: any) => {
            console.warn('[MOCK] removeChannel called - cleaning up mock subscription');
            return Promise.resolve({ status: 'ok', error: null });
        }
    } as unknown as SupabaseClient;
};
