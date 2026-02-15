import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export interface CommunicationLog {
    id: string;
    case_id: string;
    client_id?: string;
    type: 'email' | 'sms' | 'internal';
    direction: 'inbound' | 'outbound';
    content: string;
    subject?: string;
    status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
    sent_at: string;
    read_at?: string;
    sender_id?: string;
    recipient_contact?: string;
    created_at: string;
    sender?: {
        username: string;
        email: string;
    };
}

export class CommunicationService {
    /**
     * Get communication history for a case
     */
    async getCaseCommunications(caseId: string): Promise<CommunicationLog[]> {
        const { data, error } = await supabase
            .from('communication_logs')
            .select(`
                *,
                sender:profiles(username, email)
            `)
            .eq('case_id', caseId)
            .order('created_at', { ascending: true }); // Chat order

        if (error) throw error;
        return data as any;
    }

    /**
     * Get communication history for a portal client
     */
    async getPortalMessages(clientId: string): Promise<CommunicationLog[]> {
        const { data, error } = await supabase
            .from('communication_logs')
            .select(`
                *,
                sender:profiles(username, email)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as any;
    }

    /**
     * Send a message (Simulation of external API call)
     */
    async sendMessage(data: {
        case_id: string;
        client_id?: string;
        type: 'email' | 'sms' | 'internal';
        direction?: 'inbound' | 'outbound';
        content: string;
        subject?: string;
        recipient_contact?: string;
    }): Promise<CommunicationLog> {
        // In a real app, this would call Resend or Twilio APIs here.
        // For now, we just log it to the database as 'sent'.

        const { data: result, error } = await supabase
            .from('communication_logs')
            .insert({
                ...data,
                direction: data.direction || 'outbound',
                status: 'sent',
                sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }
}

export const communicationService = new CommunicationService();
