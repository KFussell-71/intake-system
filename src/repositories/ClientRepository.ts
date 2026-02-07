import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase'; // Assuming types exist or will be generated

export class ClientRepository {
    async createClient(clientData: {
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        ssn_last_four?: string;
        created_by?: string;
    }) {
        const { data, error } = await supabase
            .from('clients')
            .insert(clientData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createIntake(intakeData: {
        client_id: string;
        report_date: string;
        prepared_by?: string;
        completion_date?: string;
        data?: any;
    }) {
        const { data, error } = await supabase
            .from('intakes')
            .insert(intakeData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createClientWithIntakeRPC(params: {
        p_name: string;
        p_phone?: string;
        p_email?: string;
        p_address?: string;
        p_ssn_last_four: string;
        p_report_date: string;
        p_completion_date?: string;
        p_intake_data: any;
    }) {
        const { data, error } = await supabase.rpc('create_client_intake', params);
        if (error) throw error;
        return data;
    }

    // --- Phase 9: Client Profile & Case Management ---

    async getClientProfile(clientId: string) {
        const { data, error } = await supabase
            .from('clients')
            .select(`
                *,
                intakes (
                    id,
                    status,
                    report_date,
                    data
                ),
                assigned_to (
                    id,
                    username,
                    role
                )
            `)
            .eq('id', clientId)
            .single();

        if (error) throw error;
        return data;
    }

    async getCaseNotes(clientId: string) {
        const { data, error } = await supabase
            .from('case_notes')
            .select(`
                *,
                author:author_id (
                    username,
                    role
                )
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async createCaseNote(note: {
        client_id: string;
        author_id: string;
        content: string;
        type: 'general' | 'clinical' | 'incident' | 'administrative';
        is_draft?: boolean;
    }) {
        const { data, error } = await supabase
            .from('case_notes')
            .insert(note)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getTimelineEvents(clientId: string) {
        // Aggregate distinct events from multiple tables
        // 1. Intakes (Submission, Approval)
        const { data: intakes } = await supabase
            .from('intakes')
            .select('id, created_at, status, report_date')
            .eq('client_id', clientId);

        // 2. Case Notes (High Priority only)
        const { data: notes } = await supabase
            .from('case_notes')
            .select('id, created_at, type, content')
            .eq('client_id', clientId)
            .in('type', ['incident', 'clinical']);

        // 3. Client Creation
        const { data: client } = await supabase
            .from('clients')
            .select('created_at')
            .eq('id', clientId)
            .single();

        const events = [
            ...(intakes?.map(i => ({
                id: i.id,
                date: i.created_at,
                type: 'intake',
                title: 'Intake Assessment',
                status: i.status,
                description: `Report Date: ${i.report_date}`
            })) || []),
            ...(notes?.map(n => ({
                id: n.id,
                date: n.created_at,
                type: 'note',
                title: n.type === 'incident' ? 'Incident Report' : 'Clinical Note',
                description: n.content.substring(0, 50) + '...'
            })) || []),
            ...(client ? [{
                id: 'creation',
                date: client.created_at,
                type: 'system',
                title: 'Client Profile Created',
                description: 'Initial registration'
            }] : [])
        ];

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
}

export const clientRepository = new ClientRepository();
