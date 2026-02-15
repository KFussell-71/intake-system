
import { SupabaseClient } from '@supabase/supabase-js';

// --- Data Types ---
interface MockState {
    user: any;
    client: any;
    profiles: any[];
    client_assignments: any[];
    documents: any[];
    intakes: any[];
    supervisor_actions: any[];
    barriers: any[];
    intake_barriers: any[];
    intake_identity: any[];
    intake_sections: any[];
    observations: any[];
    consent_documents: any[];
    consent_signatures: any[];
    clients: any[];
    cases: any[];
    case_notes: any[];
    placements: any[];
    retention_checks: any[];
}


// --- Initial Seed Data (Demo Mode) ---
const SEED_USER = {
    id: 'mock-user-id',
    email: 'testuser@example.com',
    role: 'authenticated'
};

const SEED_BUNDLE = {
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
            workExperienceSummary: 'Kyla has multiple skills as a care giver...',
            ispGoals: 'Kyla will take part in the Intake...',
            barriers: ['Chronic illnesses', 'Limited transport'],
            desiredJobTitles: 'Producer, Project Coordinator',
            industryPreference: 'Non-profit, Media',
            targetPayRange: '20.00',
            strengths: 'Attention to detail',
            motivation: 'Her child',
            readinessScale: '10',
            preferredContactMethods: { email: true, text: true }
        }
    },
    // Bundle arrays
    documents: [
        { id: 'd1', name: 'Referral Form', type: 'referral', status: 'Reviewed' },
        { id: 'd2', name: 'IPE Authorization', type: 'ipe', status: 'Reviewed' }
    ],
    employment_history: [{ id: 'e1', job_title: 'Care Giver', employer: 'Home Health' }],
    isp_goals: [{ id: 'g1', goal_type: 'Obtain Employment', target_date: '2026-03-01', status: 'Active' }],
    supportive_services: [{ id: 's1', service_type: 'Transportation', status: 'Requested' }],
    follow_up: { next_meeting_date: '2026-02-02' }
};

const SEED_BARRIERS = [
    { id: 1, key: 'transportation_car', display: 'Lack of reliable vehicle', category: 'transportation', active: true },
    { id: 2, key: 'transportation_license', display: 'Suspended/No License', category: 'transportation', active: true },
    { id: 3, key: 'transportation_public', display: 'No public transit access', category: 'transportation', active: true },
    { id: 4, key: 'housing_homeless', display: 'Currently Homeless', category: 'housing', active: true },
    { id: 5, key: 'housing_unstable', display: 'At risk of eviction', category: 'housing', active: true },
    { id: 6, key: 'childcare_cost', display: 'Cannot afford childcare', category: 'family', active: true },
    { id: 7, key: 'criminal_record_felony', display: 'Felony Conviction', category: 'legal', active: true },
    { id: 8, key: 'health_mental', display: 'Untreated Mental Health', category: 'health', active: true },
    { id: 9, key: 'health_physical', display: 'Physical Disability Limit', category: 'health', active: true },
    { id: 10, key: 'education_ged', display: 'Lack of GED/Diploma', category: 'education', active: true },
    { id: 11, key: 'tech_access', display: 'No computer/internet access', category: 'technology', active: true },
    { id: 12, key: 'language_english', display: 'Limited English Proficiency', category: 'communication', active: true }
];

const SEED_WORKERS = [
    { id: 'supervisor-id', username: 'Super Visor', email: 'supervisor@newbeginning.org', role: 'supervisor' },
    { id: 'worker-1', username: 'James Jones', email: 'james.jones@nbo.org', role: 'staff' },
    { id: 'worker-2', username: 'Sarah Smith', email: 'sarah.smith@nbo.org', role: 'staff' },
    { id: 'worker-3', username: 'Mike Johnson', email: 'mike.johnson@nbo.org', role: 'staff' },
    { id: 'worker-4', username: 'Lisa Chen', email: 'lisa.chen@nbo.org', role: 'staff' }
];

const SEED_ASSIGNMENTS = [
    {
        id: 'assign-1', client_id: 'mock-client-id', assigned_worker_id: 'worker-1',
        assigned_by: 'mock-user-id', assigned_date: '2026-01-15T10:00:00Z', active: true
    }
];

const SEED_INTAKES = [
    {
        id: 'intake-awaiting-1', client_id: 'mock-client-id', status: 'awaiting_review',
        created_at: '2026-02-01T08:00:00Z', clients: { name: 'Kyla Stevenson' }, profiles: { username: 'James Jones' }
    }
];

const SEED_ACTIONS = [
    {
        id: 'action-1', supervisor_id: 'mock-user-id', action_type: 'approve', target_id: 'intake-1',
        target_type: 'intake', notes: 'Report meets DOR standards', created_at: '2026-02-01T09:15:00Z'
    }
];

const SEED_CASES = [
    {
        id: 'mock-case-id',
        client_id: 'mock-client-id',
        intake_id: 'intake-awaiting-1',
        status: 'active',
        stage: 'assessment',
        start_date: '2026-02-01T10:00:00Z',
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-01T10:00:00Z',
        client: {
            name: 'Kyla Stevenson',
            full_name: 'Kyla Stevenson',
            email: 'kyla.s@example.com',
            phone: '555-0199'
        }
    }
];

const SEED_PLACEMENTS = [
    {
        id: 'p1', client_id: 'mock-client-id', employer_name: 'City General Hospital',
        job_title: 'Patient Transporter', start_date: '2025-11-15', hourly_wage: 18.50, hours_per_week: 40
    },
    {
        id: 'p2', client_id: 'c2', employer_name: 'Quick Mart',
        job_title: 'Cashier', start_date: '2025-10-01', hourly_wage: 15.00, hours_per_week: 30
    },
    {
        id: 'p3', client_id: 'c3', employer_name: 'Tech Support Inc',
        job_title: 'Help Desk L1', start_date: '2026-01-10', hourly_wage: 22.00, hours_per_week: 40
    }
];

const SEED_RETENTION_CHECKS = [
    { id: 'r1', placement_id: 'p1', check_type: '30_day', status: 'employed', checked_at: '2025-12-15' },
    { id: 'r2', placement_id: 'p1', check_type: '60_day', status: 'employed', checked_at: '2026-01-15' },
    { id: 'r3', placement_id: 'p2', check_type: '30_day', status: 'employed', checked_at: '2025-11-01' },
    { id: 'r4', placement_id: 'p2', check_type: '60_day', status: 'unemployed', checked_at: '2025-12-01' }
];

// --- Mock Data Manager ---
class MockDataManager {
    private state: MockState;

    constructor() {
        this.state = this.getInitialState();
        // Try to load mode from cookie in browser env
        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split('; ');
            const mockMode = cookies.find(row => row.startsWith('mock_mode='))?.split('=')[1];
            if (mockMode === 'clean') {
                this.reset();
            }
        }
    }

    private getInitialState(): MockState {
        return {
            user: SEED_USER,
            client: SEED_BUNDLE.client,
            profiles: [...SEED_WORKERS],
            client_assignments: [...SEED_ASSIGNMENTS],
            documents: [...SEED_BUNDLE.documents],
            intakes: [...SEED_INTAKES],
            supervisor_actions: [...SEED_ACTIONS],
            barriers: [...SEED_BARRIERS],
            intake_barriers: [],
            clients: [{ ...SEED_BUNDLE.client }],
            intake_identity: [{
                id: 'identity-1', intake_id: 'intake-awaiting-1',
                first_name: 'Kyla', last_name: 'Stevenson',
                date_of_birth: '1990-01-01', ssn_last_four: '1234',
                phone: '555-0199', email: 'kyla.s@example.com',
                address: '123 Main St', gender: 'Female', race: 'Other'
            }],
            intake_sections: [
                { id: 's1', intake_id: 'intake-awaiting-1', section_name: 'identity', status: 'complete' },
                { id: 's2', intake_id: 'intake-awaiting-1', section_name: 'medical', status: 'in_progress' }
            ],
            observations: [],
            consent_documents: [],
            consent_signatures: [],
            cases: [...SEED_CASES],
            case_notes: [],
            placements: [...SEED_PLACEMENTS],
            retention_checks: [...SEED_RETENTION_CHECKS]
        };
    }


    reset() {
        console.log('[MOCK] Resetting to Blank State');
        this.state = {
            user: SEED_USER, // Keep user to allow login
            client: null,
            profiles: [{ ...SEED_WORKERS[0] }], // Keep one staff
            client_assignments: [],
            documents: [],
            intakes: [],
            supervisor_actions: [],
            barriers: [...SEED_BARRIERS], // Keep masters
            intake_barriers: [],
            intake_identity: [],
            intake_sections: [],
            observations: [],
            consent_documents: [],
            consent_signatures: [],
            clients: [],
            cases: [],
            case_notes: [],
            placements: [],
            retention_checks: []
        };
    }


    seed() {
        console.log('[MOCK] Restoring Demo Data');
        this.state = this.getInitialState();
    }

    // Generic specific table getter
    getTable(table: string): any[] {
        if (table === 'intakes') return this.state.intakes;
        if (table === 'profiles') return this.state.profiles;
        if (table === 'client_assignments') return this.state.client_assignments;
        if (table === 'supervisor_actions') return this.state.supervisor_actions;
        if (table === 'clients') return this.state.clients;
        if (table === 'barriers') return this.state.barriers || [];
        if (table === 'intake_barriers') return this.state.intake_barriers || [];
        if (table === 'observations') return this.state.observations || [];
        if (table === 'intake_identity') return this.state.intake_identity || [];
        if (table === 'intake_sections') return this.state.intake_sections || [];
        if (table === 'consent_documents') return this.state.consent_documents || [];
        if (table === 'consent_signatures') return this.state.consent_signatures || [];
        if (table === 'cases') return this.state.cases || [];
        if (table === 'case_notes') return this.state.case_notes || [];
        if (table === 'placements') return this.state.placements || [];
        if (table === 'retention_checks') return this.state.retention_checks || [];
        return [];
    }


    // Helper for bundle
    getBundle() {
        if (!this.state.client) return null; // Blank state
        return SEED_BUNDLE;
    }
}

const mockManager = new MockDataManager();

// --- Supabase Client Implementation ---
export const createMockSupabase = () => {
    return {
        auth: {
            getUser: async () => ({ data: { user: SEED_USER }, error: null }),
            signInWithPassword: async ({ email }: { email: string }) => {
                if (typeof document !== 'undefined') document.cookie = "sb-access-token=mock-token; path=/";

                let user = { ...SEED_USER };
                if (email === 'supervisor@newbeginning.org') {
                    user.id = 'supervisor-id';
                    user.email = email;
                    (user as any).user_metadata = { role: 'supervisor' };
                } else if (email === 'staff@newbeginning.org') {
                    user.id = 'worker-1';
                    user.email = email;
                    (user as any).user_metadata = { role: 'staff' };
                } else {
                    user.email = email;
                }

                return { data: { user, session: { access_token: 'mock-token', user } }, error: null };
            },
            signOut: async () => {
                if (typeof document !== 'undefined') document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                return { error: null };
            },
            getSession: async () => ({ data: { session: { access_token: 'mock-token', user: SEED_USER } }, error: null }),
        },
        rpc: async (fn: string, args: any) => {
            console.log(`[MOCK] RPC Call: ${fn}`, args);

            if (fn === 'create_client_intake') {
                const clientId = crypto.randomUUID?.() || `00000000-0000-4000-8000-${Date.now().toString(16).padEnd(12, '0')}`;
                const intakeId = crypto.randomUUID?.() || `00001111-0000-4000-8000-${Date.now().toString(16).padEnd(12, '0')}`;

                const newClient = {
                    id: clientId,
                    name: args.p_name,
                    phone: args.p_phone,
                    email: args.p_email,
                    address: args.p_address,
                    ssn_last_four: args.p_ssn_last_four,
                    created_at: new Date().toISOString()
                };

                const newIntake = {
                    id: intakeId,
                    client_id: clientId,
                    report_date: args.p_report_date || new Date().toISOString().split('T')[0],
                    status: 'draft',
                    data: args.p_intake_data || {},
                    created_at: new Date().toISOString()
                };

                mockManager.getTable('clients').push(newClient);
                mockManager.getTable('intakes').push(newIntake);

                return { data: { client_id: clientId, intake_id: intakeId, success: true }, error: null };
            }

            if (fn === 'admin_set_mock_mode') {
                if (args.mode === 'clean') mockManager.reset();
                else mockManager.seed();
                return { data: { success: true }, error: null };
            }

            if (fn === 'get_client_intake_bundle') {
                return { data: mockManager.getBundle(), error: null };
            }

            if (fn === 'get_supervisor_metrics') {
                return {
                    data: [{
                        stalled_cases: [
                            { id: 'c1', name: 'John Doe', days_since_last_contact: 15, risk_score: 85 },
                            { id: 'c3', name: 'Bob Smith', days_since_last_contact: 20, risk_score: 92 }
                        ],
                        compliance_gaps: {
                            unsigned_intakes: 5,
                            overdue_reviews: 3,
                            missing_docs: 12
                        },
                        goal_drift: [
                            { id: 'g1', client_name: 'John Doe', goal_title: 'Obtain GED', target_date: '2026-01-15', days_past: 30 },
                            { id: 'g2', client_name: 'Jane Smith', goal_title: 'Find Part-time Job', target_date: '2026-02-01', days_past: 14 }
                        ],
                        upcoming_exits: [
                            { id: 'e1', client_name: 'Alice Cooper', exit_date: '2026-03-05', placement_confirmed: true },
                            { id: 'e2', client_name: 'Charlie Brown', exit_date: '2026-03-15', placement_confirmed: false }
                        ],
                        pipeline_velocity: [
                            { stage: 'intake', avg_days: 12, case_count: 45 },
                            { stage: 'assessment', avg_days: 14, case_count: 38 },
                            { stage: 'planning', avg_days: 11, case_count: 32 },
                            { stage: 'service_delivery', avg_days: 15, case_count: 28 },
                            { stage: 'review', avg_days: 18, case_count: 25 }
                        ],

                        caseload_stats: [
                            { worker_name: 'James Jones', active_cases: 12, capacity: 15 },
                            { worker_name: 'Sarah Smith', active_cases: 14, capacity: 15 },
                            { worker_name: 'Mike Johnson', active_cases: 8, capacity: 15 }
                        ]
                    }],
                    error: null
                };
            }

            if (fn === 'get_weekly_agency_metrics') {
                return {
                    data: {
                        total_active_cases: 45,
                        new_intakes: 12,
                        placements_count: 8,
                        avg_wage: 18.50,
                        retention_rate_30: 0.92,
                        high_risk_count: 3,
                        compliance_score: 95
                    },
                    error: null
                };
            }

            return { data: null, error: null };
        },
        from: (table: string) => {
            const queryBuilder: any = {
                _filters: [] as { column: string, value: any }[],
                select: () => queryBuilder,
                eq: (column: string, value: any) => {
                    queryBuilder._filters.push({ column, value });
                    return queryBuilder;
                },
                gt: () => queryBuilder,
                gte: () => queryBuilder,
                lte: () => queryBuilder,
                lt: () => queryBuilder,
                neq: () => queryBuilder,
                is: () => queryBuilder,
                in: () => queryBuilder,
                contains: () => queryBuilder,
                order: () => queryBuilder,
                limit: () => queryBuilder,
                range: () => queryBuilder,
                single: async () => {
                    let data = mockManager.getTable(table);
                    if (queryBuilder._filters) {
                        for (const filter of queryBuilder._filters) {
                            data = data.filter(item => item[filter.column] === filter.value);
                        }
                    }
                    return { data: data.length > 0 ? data[0] : null, error: null };
                },
                maybeSingle: async () => {
                    let data = mockManager.getTable(table);
                    if (queryBuilder._filters) {
                        for (const filter of queryBuilder._filters) {
                            data = data.filter(item => item[filter.column] === filter.value);
                        }
                    }
                    return { data: data.length > 0 ? data[0] : null, error: null };
                },
                insert: async (data: any) => {
                    console.log(`[MOCK] Inserting into ${table}`, data);
                    const tableData = mockManager.getTable(table);
                    // Simulate Audit
                    if (['placements', 'retention_checks'].includes(table)) {
                        console.log(`[MOCK AUDIT] Trigger fired on ${table}`);
                    }
                    const newData = { ...data, id: data.id || `mock-${Date.now()}` };
                    if (tableData) tableData.push(newData);
                    return { data: newData, error: null };
                },
                update: async (data: any) => {
                    console.log(`[MOCK] Updating ${table}`, data);
                    return { data: null, error: null };
                },
                delete: async () => {
                    console.log(`[MOCK] Deleting from ${table}`);
                    return { data: null, error: null };
                },
                upsert: async (data: any) => {
                    console.log(`[MOCK] Upserting into ${table}`, data);
                    const tableData = mockManager.getTable(table);
                    if (tableData) tableData.push(data);
                    return { data, error: null };
                }
            };

            // Allow await on the builder itself (simulating thenable)
            (queryBuilder as any).then = async (resolve: any, reject: any) => {
                let data = mockManager.getTable(table);
                if (queryBuilder._filters) {
                    for (const filter of queryBuilder._filters) {
                        data = data.filter(item => item[filter.column] === filter.value);
                    }
                }
                resolve({ data, error: null, count: data.length });
            };

            return queryBuilder;
        },
        storage: {
            from: () => ({
                upload: async () => ({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://placehold.co/600x400' } })
            })
        },
        channel: (name: string) => ({
            on: () => ({
                subscribe: () => { }
            }),
            subscribe: async (callback: any) => {
                if (callback) callback('SUBSCRIBED');
                return { error: null };
            },
            unsubscribe: () => { },
            send: async () => ({ error: null })
        }),
        removeChannel: async () => ({ error: null })
    } as unknown as SupabaseClient;
};
