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
            const queryBuilder = {
                select: (cols?: string) => queryBuilder,
                eq: (col: string, val: any) => queryBuilder,
                gt: (col: string, val: any) => queryBuilder,
                limit: (n: number) => queryBuilder,
                single: async () => {
                    if (table === 'profiles') return { data: { role: 'staff' }, error: null };
                    if (table === 'report_versions') return { data: null, error: null }; // No recent reports
                    if (table === 'clients') return { data: MOCK_BUNDLE.client, error: null };
                    return { data: {}, error: null };
                },
                maybeSingle: async () => ({ data: { role: 'staff' }, error: null }),
                insert: async (data: any) => ({ error: null }),
                update: async (data: any) => ({
                    eq: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) })
                }),
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
                upload: async () => ({ data: { path: 'mock.pdf' }, error: null }),
                createSignedUrl: async () => ({ data: { signedUrl: '#mock-pdf' }, error: null })
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
