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

const SEED_WORKERS = [
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
            supervisor_actions: [...SEED_ACTIONS]
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
            supervisor_actions: []
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
        if (table === 'clients') return this.state.client ? [this.state.client] : [];
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
    // console.warn('[MOCK] Creating Mock Supabase Client (Mode: ' + (mockManager.getTable('intakes').length > 0 ? 'Demo' : 'Clean') + ')');

    return {
        auth: {
            getUser: async () => ({ data: { user: SEED_USER }, error: null }),
            signInWithPassword: async ({ email }: { email: string }) => {
                if (typeof document !== 'undefined') document.cookie = "sb-access-token=mock-token; path=/";

                let user = { ...SEED_USER };
                if (email === 'supervisor@newbeginning.org') {
                    user.id = 'supervisor-id';
                    user.email = email;
                    // We assume the app uses metadata or just email check for role, 
                    // but let's add metadata just in case
                    (user as any).user_metadata = { role: 'supervisor' };
                } else if (email === 'staff@newbeginning.org') {
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
        from: (table: string) => {
            const queryBuilder: any = {
                select: () => queryBuilder,
                eq: () => queryBuilder,
                gt: () => queryBuilder,
                gte: () => queryBuilder,
                lt: () => queryBuilder,
                lte: () => queryBuilder,
                neq: () => queryBuilder,
                not: () => queryBuilder,
                order: () => queryBuilder,
                range: () => queryBuilder,
                limit: () => queryBuilder,
                single: async () => {
                    const data = mockManager.getTable(table);
                    return { data: data.length > 0 ? data[0] : null, error: null };
                },
                maybeSingle: async () => {
                    const data = mockManager.getTable(table);
                    return { data: data.length > 0 ? data[0] : null, error: null };
                },
                then: async (resolve: Function) => {
                    const data = mockManager.getTable(table);
                    // Mock counts for dashboard
                    const count = data.length;
                    resolve({ data, error: null, count });
                },
                insert: async (data: any) => {
                    console.log(`[MOCK] Inserting into ${table}`, data);
                    // In a real in-memory implementation we would push to mockManager.state[table]
                    // For now, we simulate success for the UI verification
                    return { data: { ...data, id: `new-${Date.now()}` }, error: null };
                },
                upsert: async (data: any) => {
                    console.log(`[MOCK] Upserting into ${table}`, data);
                    return { data: { ...data, id: `upsert-${Date.now()}` }, error: null };
                },
                update: async (data: any) => {
                    console.log(`[MOCK] Updating ${table}`, data);
                    return { data: { ...data }, error: null };
                },
                delete: async () => {
                    console.log(`[MOCK] Deleting from ${table}`);
                    return { data: null, error: null };
                }
            };
            return queryBuilder;
        },
        rpc: async (fn: string, args: any) => {
            console.log(`[MOCK] RPC Call: ${fn}`, args);

            // --- NEW ADMIN FUNCTIONS ---
            if (fn === 'admin_set_mock_mode') {
                if (args.mode === 'clean') mockManager.reset();
                else mockManager.seed();
                return { data: { success: true }, error: null };
            }

            if (fn === 'get_client_intake_bundle') {
                return { data: mockManager.getBundle(), error: null };
            }

            // Dashboard Stat Counts - Return dynamic counts based on mockManager state
            if (fn === 'get_my_workload') {
                const intakes = mockManager.getTable('intakes');
                return {
                    data: [{
                        active_cases: mockManager.getTable('clients').length,
                        pending_reviews: intakes.filter(i => i.status === 'awaiting_review').length
                    }],
                    error: null
                };
            }

            return { data: [], error: null };
        },
        storage: {
            from: () => ({
                upload: async () => ({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://placehold.co/600x400' } })
            })
        },
        channel: (name: string) => {
            console.warn(`[MOCK] Creating realtime channel '${name}'`);
            return {
                on: () => ({
                    subscribe: () => ({
                        unsubscribe: () => console.log(`[MOCK] Unsubscribed from ${name}`)
                    })
                }),
                subscribe: async (callback: any) => {
                    console.log(`[MOCK] Subscribed to ${name}`);
                    if (callback) callback('SUBSCRIBED');
                    return { error: null };
                },
                unsubscribe: () => console.log(`[MOCK] Unsubscribed from ${name}`)
            } as any;
        },
        removeChannel: async () => ({ error: null })
    } as unknown as SupabaseClient;
};
