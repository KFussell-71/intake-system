import { supabase } from '@/lib/supabase';
import { Case, CaseStatus, CaseStage } from '@/types/case';

export class CaseService {
    /**
     * Create a new case from an intake
     * Triggered when an intake is approved and converted to a case.
     */
    async createCaseFromIntake(clientId: string, userId: string): Promise<Case | null> {
        try {
            const { data, error } = await supabase
                .from('cases')
                .insert({
                    client_id: clientId,
                    assigned_to: userId,
                    status: 'active',
                    stage: 'assessment',
                    start_date: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating case:', error);
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a single case by ID with related data
     */
    async getCaseById(caseId: string): Promise<Case | null> {
        const { data, error } = await supabase
            .from('cases')
            .select(`
                *,
                client:clients(*),
                assigned_to:profiles(*)
            `)
            .eq('id', caseId)
            .single();

        if (error) throw error;
        return data as any;
    }

    /**
     * Get cases for a client
     */
    async getCasesByClient(clientId: string): Promise<Case[]> {
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Case[];
    }

    /**
     * Update case stage
     */
    async updateCaseStage(caseId: string, stage: CaseStage): Promise<Case | null> {
        const { data, error } = await supabase
            .from('cases')
            .update({ stage })
            .eq('id', caseId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update case status (e.g., close case)
     */
    async updateCaseStatus(caseId: string, status: CaseStatus, closureReason?: string): Promise<Case | null> {
        const updateData: any = { status };
        if (status === 'closed') {
            updateData.closed_date = new Date().toISOString();
            if (closureReason) updateData.closure_reason = closureReason;
        }

        const { data, error } = await supabase
            .from('cases')
            .update(updateData)
            .eq('id', caseId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all cases (for dashboard)
     * Optionally filter by assigned user
     */
    async getCases(assignedToUserId?: string): Promise<Case[]> {
        let query = supabase
            .from('cases')
            .select(`
                *,
                client:clients(first_name, last_name, email),
                assigned_to:profiles(first_name, last_name)
            `)
            .order('updated_at', { ascending: false });

        if (assignedToUserId) {
            query = query.eq('assigned_to', assignedToUserId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as any;
    }

    /**
     * Get aggregated timeline for a case
     * Merges notes, service logs, and status changes (mocked/derived)
     */
    async getCaseTimeline(caseId: string): Promise<any[]> {
        // 1. Fetch Case Notes
        const { data: notes } = await supabase
            .from('case_notes')
            .select('*, author:profiles(username)')
            .eq('client_id', (await this.getCaseById(caseId))?.client_id)
            .order('created_at', { ascending: false })
            .limit(10);

        // 2. Fetch Service Logs including provider details
        const { data: services } = await supabase
            .from('service_logs')
            .select('*, provider:profiles(username)')
            .eq('case_id', caseId)
            .order('performed_at', { ascending: false })
            .limit(10);

        // Combine and sort
        const timeline = [
            ...(notes?.map(n => ({ ...n, type: 'note', date: n.created_at })) || []),
            ...(services?.map(s => ({ ...s, type: 'service', date: s.performed_at })) || [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return timeline;
    }

    /**
     * Log a service delivery
     */
    async logService(data: { case_id: string; service_type: string; notes?: string; duration_minutes?: number; performed_at?: string; provider_id?: string }): Promise<any> {
        const { data: result, error } = await supabase
            .from('service_logs')
            .insert({
                case_id: data.case_id,
                service_type: data.service_type,
                notes: data.notes,
                duration_minutes: data.duration_minutes,
                performed_at: data.performed_at || new Date().toISOString(),
                provider_id: data.provider_id
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    /**
     * Schedule a follow-up
     */
    async scheduleFollowUp(data: { case_id: string; scheduled_date: string; type: string; notes?: string }): Promise<any> {
        const { data: result, error } = await supabase
            .from('follow_ups')
            .insert({
                case_id: data.case_id,
                scheduled_date: data.scheduled_date,
                type: data.type,
                status: 'scheduled',
                notes: data.notes
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }
}

export const caseService = new CaseService();
